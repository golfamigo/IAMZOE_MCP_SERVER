import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ajv from '../utils/ajv'; // Use centralized AJV
import { neo4jClient } from '../db';
import { toJsNumber } from '../utils/neo4jUtils';
import { authenticateApiKey } from '../middleware/auth';
import { 
  CreateStaffRequest, 
  CreateStaffResponse,
  StaffResponse,
  StaffListResponse,
  ErrorResponse
} from '../types/api';

const router = express.Router();

// 建立員工 Schema
const createStaffSchema = {
  type: 'object',
  properties: {
    business_id: { type: 'string', format: 'uuid' },
    staff_member_name: { type: 'string', maxLength: 255 },
    staff_member_email: { type: 'string', format: 'email' },
    staff_member_phone: { type: 'string' },
    staff_member_hire_date: { type: 'string', format: 'date' }
  },
  required: ['business_id', 'staff_member_name', 'staff_member_email'],
  additionalProperties: false
};

// 驗證函式
const validateCreateStaff = ajv.compile<CreateStaffRequest>(createStaffSchema);
// 建立員工 API
router.post('/staff', authenticateApiKey, async (req: Request, res: Response) => {
  const staffData = req.body as CreateStaffRequest;

  // 驗證請求數據
  if (!validateCreateStaff(staffData)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '無效的請求參數',
      details: validateCreateStaff.errors
    } as ErrorResponse);
return;
  }

  try {
    // 檢查 business_id 是否存在
    const businessResult = await neo4jClient.runQuery(
      'MATCH (b:Business {business_id: $business_id}) RETURN b',
      { business_id: staffData.business_id }
    );

    if (businessResult.records.length === 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '指定的商家不存在'
      } as ErrorResponse);
return;
    }

    // 檢查 email 是否已存在
    const emailResult = await neo4jClient.runQuery(
      'MATCH (s:Staff {staff_member_email: $staff_member_email, business_id: $business_id}) RETURN s',
      { 
        staff_member_email: staffData.staff_member_email,
        business_id: staffData.business_id
      }
    );

    if (emailResult.records.length > 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '該 Email 已被註冊'
      } as ErrorResponse);
return;
    }

    // 創建新的員工
    const staff_member_id = uuidv4();
    const user_id = uuidv4();

    // 先創建 User 節點
    await neo4jClient.runQuery(
      `CREATE (u:User {
        user_id: $user_id,
        user_name: $staff_member_name,
        email: $staff_member_email,
        phone: $staff_member_phone,
        line_notification_enabled: true,
        created_at: datetime(),
        updated_at: datetime()
      })`,
      {
        user_id,
        staff_member_name: staffData.staff_member_name,
        staff_member_email: staffData.staff_member_email,
        staff_member_phone: staffData.staff_member_phone || null
      }
    );

    // 創建 Staff 節點並建立關係
    const createResult = await neo4jClient.runQuery(
      `CREATE (s:Staff {
        staff_member_id: $staff_member_id,
        business_id: $business_id,
        staff_member_name: $staff_member_name,
        staff_member_email: $staff_member_email,
        staff_member_phone: $staff_member_phone,
        staff_member_hire_date: $staff_member_hire_date,
        staff_member_is_active: true,
        created_at: datetime(),
        updated_at: datetime()
      })
      WITH s
      MATCH (u:User {user_id: $user_id})
      CREATE (s)-[:BELONGS_TO]->(u)
      MATCH (b:Business {business_id: $business_id})
      CREATE (s)-[:WORKS_FOR]->(b)
      RETURN s`,
      {
        staff_member_id,
        user_id,
        business_id: staffData.business_id,
        staff_member_name: staffData.staff_member_name,
        staff_member_email: staffData.staff_member_email,
        staff_member_phone: staffData.staff_member_phone || null,
        staff_member_hire_date: staffData.staff_member_hire_date || null
      }
    );

    if (createResult.records.length === 0) {
      res.status(500).json({
        error_code: 'SERVER_ERROR',
        message: '建立員工失敗'
      } as ErrorResponse);
return;
    }

    // 回傳成功結果
    res.status(201).json({ staff_member_id } as CreateStaffResponse);
return;
  } catch (error) {
    console.error('建立員工時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 取得員工資訊 API
router.get('/staff/:staff_member_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { staff_member_id } = req.params;

  try {
    // 查詢員工資訊
    const staffResult = await neo4jClient.runQuery(
      'MATCH (s:Staff {staff_member_id: $staff_member_id}) RETURN s',
      { staff_member_id }
    );

    if (staffResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的員工'
      } as ErrorResponse);
return;
    }

    // 轉換為響應格式
    const staff = staffResult.records[0].get('s').properties;
    const staffResponse: StaffResponse = {
      staff_member_id: staff.staff_member_id,
      business_id: staff.business_id,
      staff_member_name: staff.staff_member_name,
      staff_member_email: staff.staff_member_email,
      staff_member_phone: staff.staff_member_phone,
      staff_member_hire_date: staff.staff_member_hire_date,
      staff_member_termination_date: staff.staff_member_termination_date,
      staff_member_is_active: staff.staff_member_is_active
    };

    res.status(200).json(staffResponse);
return;
  } catch (error) {
    console.error('取得員工資訊時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 更新員工資訊 API
router.put('/staff/:staff_member_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { staff_member_id } = req.params;
  const updateData = req.body;

  // 驗證員工是否存在
  try {
    const staffResult = await neo4jClient.runQuery(
      'MATCH (s:Staff {staff_member_id: $staff_member_id}) RETURN s',
      { staff_member_id }
    );

    if (staffResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的員工'
      } as ErrorResponse);
return;
    }

    // 構建更新查詢
    let updateQuery = 'MATCH (s:Staff {staff_member_id: $staff_member_id}) ';
    let setClause = 'SET s.updated_at = datetime() ';
    const params: Record<string, any> = { staff_member_id };

    // 動態添加更新欄位
    if (updateData.staff_member_name) {
      setClause += ', s.staff_member_name = $staff_member_name';
      params.staff_member_name = updateData.staff_member_name;
    }

    if (updateData.staff_member_phone) {
      setClause += ', s.staff_member_phone = $staff_member_phone';
      params.staff_member_phone = updateData.staff_member_phone;
    }

    if (updateData.staff_member_hire_date) {
      setClause += ', s.staff_member_hire_date = $staff_member_hire_date';
      params.staff_member_hire_date = updateData.staff_member_hire_date;
    }

    if (updateData.staff_member_termination_date) {
      setClause += ', s.staff_member_termination_date = $staff_member_termination_date';
      params.staff_member_termination_date = updateData.staff_member_termination_date;
    }

    if (updateData.staff_member_is_active !== undefined) {
      setClause += ', s.staff_member_is_active = $staff_member_is_active';
      params.staff_member_is_active = updateData.staff_member_is_active;
    }

    // 執行更新
    updateQuery += setClause + ' RETURN s';
    await neo4jClient.runQuery(updateQuery, params);

    // 如果有更新 name, phone，也要更新關聯的 User 節點
    if (updateData.staff_member_name || updateData.staff_member_phone) {
      let userSetClause = 'SET u.updated_at = datetime() ';
      if (updateData.staff_member_name) {
        userSetClause += ', u.user_name = $staff_member_name';
      }
      if (updateData.staff_member_phone) {
        userSetClause += ', u.phone = $staff_member_phone';
      }

      await neo4jClient.runQuery(
        `MATCH (s:Staff {staff_member_id: $staff_member_id})-[:BELONGS_TO]->(u:User)
         ${userSetClause}`,
        params
      );
    }

    res.status(204).send();
return;
  } catch (error) {
    console.error('更新員工資訊時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 刪除員工 API
router.delete('/staff/:staff_member_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { staff_member_id } = req.params;

  try {
    // 查詢員工是否存在
    const staffResult = await neo4jClient.runQuery(
      'MATCH (s:Staff {staff_member_id: $staff_member_id}) RETURN s',
      { staff_member_id }
    );

    if (staffResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的員工'
      } as ErrorResponse);
return;
    }

    // 檢查員工是否有未完成的預約
    const bookingResult = await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id})<-[:ASSIGNED_TO]-(b:Booking)
       WHERE b.booking_status_code IN ['pending', 'confirmed']
       RETURN b`,
      { staff_member_id }
    );

    if (bookingResult.records.length > 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '該員工還有未完成的預約，無法刪除'
      } as ErrorResponse);
return;
    }

    // 刪除員工與關聯關係
    await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id})
       OPTIONAL MATCH (s)-[r]-()
       DELETE r, s`,
      { staff_member_id }
    );

    res.status(204).send();
return;
  } catch (error) {
    console.error('刪除員工時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 查詢員工列表 API
router.get('/staff', authenticateApiKey, async (req: Request, res: Response) => {
  const { business_id, is_active, limit = '10', offset = '0' } = req.query;

  if (!business_id) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '缺少必要參數: business_id'
    } as ErrorResponse);
return;
  }

  try {
    // 構建查詢
    let query = `MATCH (s:Staff {business_id: $business_id})`;
    const params: Record<string, any> = { 
      business_id,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10)
    };

    // 如果指定了啟用狀態
    if (is_active !== undefined) {
      const isActiveValue = is_active === 'true';
      query += ` WHERE s.staff_member_is_active = $is_active`;
      params.is_active = isActiveValue;
    }

    // 總數查詢
    const countQuery = query + ` RETURN count(s) as total`;
    const countResult = await neo4jClient.runQuery(countQuery, params);
    const total = toJsNumber(countResult.records[0].get('total'));

    // 分頁查詢
    query += ` RETURN s ORDER BY s.staff_member_name SKIP $offset LIMIT $limit`;
    const result = await neo4jClient.runQuery(query, params);

    // 轉換為響應格式
    const staffList = result.records.map(record => {
      const s = record.get('s').properties;
      return {
        staff_member_id: s.staff_member_id,
        business_id: s.business_id,
        staff_member_name: s.staff_member_name,
        staff_member_email: s.staff_member_email,
        staff_member_phone: s.staff_member_phone,
        staff_member_hire_date: s.staff_member_hire_date
      } as StaffResponse;
    });

    const response: StaffListResponse = {
      total,
      staff: staffList
    };

    res.status(200).json(response);
return;
  } catch (error) {
    console.error('查詢員工列表時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 尋找協作員工 API
router.get('/businesses/:business_id/staff/collaborators', authenticateApiKey, async (req: Request, res: Response) => {
  const { business_id } = req.params;
  const { staff_member_id, limit = '10' } = req.query;

  try {
    // 構建查詢
    let query = '';
    const params: Record<string, any> = { 
      business_id,
      limit: parseInt(limit as string, 10)
    };

    // 如果指定了特定員工
    if (staff_member_id) {
      // 查詢指定員工的協作者
      query = `
        MATCH (s1:Staff {staff_member_id: $staff_member_id, business_id: $business_id})-[:ASSIGNED_TO]->(b:Booking)<-[:ASSIGNED_TO]-(s2:Staff)
        WHERE s1 <> s2
        WITH s2, count(b) AS common_bookings
        ORDER BY common_bookings DESC
        LIMIT $limit
        RETURN s2, common_bookings
      `;
      params.staff_member_id = staff_member_id;
    } else {
      // 查詢整個商家最常協作的員工對
      query = `
        MATCH (s1:Staff {business_id: $business_id})-[:ASSIGNED_TO]->(b:Booking)<-[:ASSIGNED_TO]-(s2:Staff {business_id: $business_id})
        WHERE s1 <> s2 AND ID(s1) < ID(s2)
        WITH s1, s2, count(b) AS common_bookings
        ORDER BY common_bookings DESC
        LIMIT $limit
        RETURN s1, s2, common_bookings
      `;
    }

    const result = await neo4jClient.runQuery(query, params);

    // 轉換為響應格式
    let collaborators = [];
    if (staff_member_id) {
      collaborators = result.records.map(record => {
        const s2 = record.get('s2').properties;
        const common_bookings = toJsNumber(record.get('common_bookings'));
        return {
          staff_member_id: s2.staff_member_id,
          staff_member_name: s2.staff_member_name,
          common_bookings
        };
      });
    } else {
      collaborators = result.records.map(record => {
        const s1 = record.get('s1').properties;
        const s2 = record.get('s2').properties;
        const common_bookings = toJsNumber(record.get('common_bookings'));
        return {
          staff_pair: [
            {
              staff_member_id: s1.staff_member_id,
              staff_member_name: s1.staff_member_name
            },
            {
              staff_member_id: s2.staff_member_id,
              staff_member_name: s2.staff_member_name
            }
          ],
          common_bookings
        };
      });
    }

    res.status(200).json(collaborators);
return;
  } catch (error) {
    console.error('尋找協作員工時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

export default router;
