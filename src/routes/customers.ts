import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ajv from '../utils/ajv'; // Use centralized AJV
import { neo4jClient } from '../db';
import { toJsNumber } from '../utils/neo4jUtils';
import { authenticateApiKey } from '../middleware/auth';
import { 
  CreateCustomerRequest, 
  CreateCustomerResponse,
  CustomerResponse,
  CustomerListResponse,
  ErrorResponse
} from '../types/api';

const router = express.Router();


// 建立顧客 Schema
const createCustomerSchema = {
  type: 'object',
  properties: {
    business_id: { type: 'string', format: 'uuid' },
    customer_name: { type: 'string', maxLength: 255 },
    customer_email: { type: 'string', format: 'email' },
    customer_phone: { type: 'string' },
    customer_birthdate: { type: 'string', format: 'date' },
    gender: { type: 'string', enum: ['male', 'female', 'other'] }
  },
  required: ['business_id', 'customer_name', 'customer_email'],
  additionalProperties: false
};

// 驗證函式
const validateCreateCustomer = ajv.compile<CreateCustomerRequest>(createCustomerSchema);
// 建立顧客 API
router.post('/customers', authenticateApiKey, async (req: Request, res: Response) => {
  const customerData = req.body as CreateCustomerRequest;

  // 驗證請求數據
  if (!validateCreateCustomer(customerData)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '無效的請求參數',
      details: validateCreateCustomer.errors
    } as ErrorResponse);
return;
  }

  try {
    // 檢查 business_id 是否存在
    const businessResult = await neo4jClient.runQuery(
      'MATCH (b:Business {business_id: $business_id}) RETURN b',
      { business_id: customerData.business_id }
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
      'MATCH (c:Customer {customer_email: $customer_email, business_id: $business_id}) RETURN c',
      { 
        customer_email: customerData.customer_email,
        business_id: customerData.business_id
      }
    );

    if (emailResult.records.length > 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '該 Email 已被註冊'
      } as ErrorResponse);
return;
    }

    // 創建新的顧客
    const customer_profile_id = uuidv4();
    const user_id = uuidv4();

    // 先創建 User 節點
    await neo4jClient.runQuery(
      `CREATE (u:User {
        user_id: $user_id,
        user_name: $customer_name,
        email: $customer_email,
        phone: $customer_phone,
        line_notification_enabled: true,
        created_at: datetime(),
        updated_at: datetime()
      })`,
      {
        user_id,
        customer_name: customerData.customer_name,
        customer_email: customerData.customer_email,
        customer_phone: customerData.customer_phone || null
      }
    );

    // 創建 Customer 節點並建立關係
    const createResult = await neo4jClient.runQuery(
      `CREATE (c:Customer {
        customer_profile_id: $customer_profile_id,
        business_id: $business_id,
        customer_name: $customer_name,
        customer_email: $customer_email,
        customer_phone: $customer_phone,
        customer_birthdate: $customer_birthdate,
        gender: $gender,
        created_at: datetime(),
        updated_at: datetime()
      })
      WITH c
      MATCH (u:User {user_id: $user_id})
      CREATE (c)-[:BELONGS_TO]->(u)
      MATCH (b:Business {business_id: $business_id})
      CREATE (c)-[:BELONGS_TO]->(b)
      RETURN c`,
      {
        customer_profile_id,
        user_id,
        business_id: customerData.business_id,
        customer_name: customerData.customer_name,
        customer_email: customerData.customer_email,
        customer_phone: customerData.customer_phone || null,
        customer_birthdate: customerData.customer_birthdate || null,
        gender: customerData.gender || null
      }
    );

    if (createResult.records.length === 0) {
      res.status(500).json({
        error_code: 'SERVER_ERROR',
        message: '建立顧客失敗'
      } as ErrorResponse);
return;
    }

    // 回傳成功結果
    res.status(201).json({ customer_profile_id } as CreateCustomerResponse);
return;
  } catch (error) {
    console.error('建立顧客時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 取得顧客資訊 API
router.get('/customers/:customer_profile_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { customer_profile_id } = req.params;

  try {
    // 查詢顧客資訊
    const customerResult = await neo4jClient.runQuery(
      'MATCH (c:Customer {customer_profile_id: $customer_profile_id}) RETURN c',
      { customer_profile_id }
    );

    if (customerResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的顧客'
      } as ErrorResponse);
return;
    }

    // 轉換為響應格式
    const customer = customerResult.records[0].get('c').properties;
    const customerResponse: CustomerResponse = {
      customer_profile_id: customer.customer_profile_id,
      business_id: customer.business_id,
      customer_name: customer.customer_name,
      customer_email: customer.customer_email,
      customer_phone: customer.customer_phone,
      customer_birthdate: customer.customer_birthdate,
      gender: customer.gender
    };

    res.status(200).json(customerResponse);
return;
  } catch (error) {
    console.error('取得顧客資訊時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 更新顧客資訊 API
router.put('/customers/:customer_profile_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { customer_profile_id } = req.params;
  const updateData = req.body;

  // 驗證顧客是否存在
  try {
    const customerResult = await neo4jClient.runQuery(
      'MATCH (c:Customer {customer_profile_id: $customer_profile_id}) RETURN c',
      { customer_profile_id }
    );

    if (customerResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的顧客'
      } as ErrorResponse);
return;
    }

    // 構建更新查詢
    let updateQuery = 'MATCH (c:Customer {customer_profile_id: $customer_profile_id}) ';
    let setClause = 'SET c.updated_at = datetime() ';
    const params: Record<string, any> = { customer_profile_id };

    // 動態添加更新欄位
    if (updateData.customer_name) {
      setClause += ', c.customer_name = $customer_name';
      params.customer_name = updateData.customer_name;
    }

    if (updateData.customer_phone) {
      setClause += ', c.customer_phone = $customer_phone';
      params.customer_phone = updateData.customer_phone;
    }

    if (updateData.customer_birthdate) {
      setClause += ', c.customer_birthdate = $customer_birthdate';
      params.customer_birthdate = updateData.customer_birthdate;
    }

    if (updateData.gender) {
      if (!['male', 'female', 'other'].includes(updateData.gender)) {
        res.status(400).json({
          error_code: 'BAD_REQUEST',
          message: '性別必須是 male、female 或 other'
        } as ErrorResponse);
return;
      }
      setClause += ', c.gender = $gender';
      params.gender = updateData.gender;
    }

    // 執行更新
    updateQuery += setClause + ' RETURN c';
    await neo4jClient.runQuery(updateQuery, params);

    // 如果有更新 name, email, phone，也要更新關聯的 User 節點
    if (updateData.customer_name || updateData.customer_phone) {
      let userSetClause = 'SET u.updated_at = datetime() ';
      if (updateData.customer_name) {
        userSetClause += ', u.user_name = $customer_name';
      }
      if (updateData.customer_phone) {
        userSetClause += ', u.phone = $customer_phone';
      }

      await neo4jClient.runQuery(
        `MATCH (c:Customer {customer_profile_id: $customer_profile_id})-[:BELONGS_TO]->(u:User)
         ${userSetClause}`,
        params
      );
    }

    res.status(204).send();
return;
  } catch (error) {
    console.error('更新顧客資訊時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 刪除顧客 API
router.delete('/customers/:customer_profile_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { customer_profile_id } = req.params;

  try {
    // 查詢顧客是否存在
    const customerResult = await neo4jClient.runQuery(
      'MATCH (c:Customer {customer_profile_id: $customer_profile_id}) RETURN c',
      { customer_profile_id }
    );

    if (customerResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的顧客'
      } as ErrorResponse);
return;
    }

    // 檢查顧客是否有未完成的預約
    const bookingResult = await neo4jClient.runQuery(
      `MATCH (c:Customer {customer_profile_id: $customer_profile_id})-[:MADE]->(b:Booking)
       WHERE b.booking_status_code IN ['pending', 'confirmed']
       RETURN b`,
      { customer_profile_id }
    );

    if (bookingResult.records.length > 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '該顧客還有未完成的預約，無法刪除'
      } as ErrorResponse);
return;
    }

    // 刪除顧客與關聯關係
    await neo4jClient.runQuery(
      `MATCH (c:Customer {customer_profile_id: $customer_profile_id})
       OPTIONAL MATCH (c)-[r]-()
       DELETE r, c`,
      { customer_profile_id }
    );

    res.status(204).send();
return;
  } catch (error) {
    console.error('刪除顧客時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 查詢顧客列表 API
router.get('/customers', authenticateApiKey, async (req: Request, res: Response) => {
  const { business_id, membership_level_id, limit = '10', offset = '0' } = req.query;

  if (!business_id) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '缺少必要參數: business_id'
    } as ErrorResponse);
return;
  }

  try {
    // 構建查詢
    let query = `MATCH (c:Customer {business_id: $business_id})`;
    const params: Record<string, any> = { 
      business_id,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10)
    };

    // 如果指定了會員等級
    if (membership_level_id) {
      query += ` MATCH (c)-[:HAS_MEMBERSHIP]->(m:MembershipLevel {membership_level_id: $membership_level_id})`;
      params.membership_level_id = membership_level_id;
    }

    // 總數查詢
    const countQuery = query + ` RETURN count(c) as total`;
    const countResult = await neo4jClient.runQuery(countQuery, params);
    const total = toJsNumber(countResult.records[0].get('total'));

    // 分頁查詢
    query += ` RETURN c ORDER BY c.customer_name SKIP $offset LIMIT $limit`;
    const result = await neo4jClient.runQuery(query, params);

    // 轉換為響應格式
    const customers = result.records.map(record => {
      const c = record.get('c').properties;
      return {
        customer_profile_id: c.customer_profile_id,
        business_id: c.business_id,
        customer_name: c.customer_name,
        customer_email: c.customer_email,
        customer_phone: c.customer_phone,
        customer_birthdate: c.customer_birthdate,
        gender: c.gender
      } as CustomerResponse;
    });

    const response: CustomerListResponse = {
      total,
      customers
    };

    res.status(200).json(response);
return;
  } catch (error) {
    console.error('查詢顧客列表時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 推薦相似顧客 API
router.get('/customers/:customer_id/recommendations/similar_customers', authenticateApiKey, async (req: Request, res: Response) => {
  const { customer_id } = req.params;
  const { limit = '10' } = req.query;

  try {
    // 查詢顧客是否存在
    const customerResult = await neo4jClient.runQuery(
      'MATCH (c:Customer {customer_profile_id: $customer_id}) RETURN c',
      { customer_id }
    );

    if (customerResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的顧客'
      } as ErrorResponse);
return;
    }

    // 查詢相似顧客 (基於共同預約的服務)
    const similarResult = await neo4jClient.runQuery(
      `MATCH (c:Customer {customer_profile_id: $customer_id})-[:MADE]->(b:Booking)-[:BOOKS]->(bi:BookableItem)<-[:BOOKS]-(b2:Booking)<-[:MADE]-(c2:Customer)
       WHERE c <> c2
       WITH c2, count(bi) AS common_items
       ORDER BY common_items DESC
       LIMIT $limit
       RETURN c2, common_items`,
      { 
        customer_id,
        limit: parseInt(limit as string, 10)
      }
    );

    // 轉換為響應格式
    const similarCustomers = similarResult.records.map(record => {
      const c2 = record.get('c2').properties;
      const common_items = toJsNumber(record.get('common_items'));
      return {
        customer_profile_id: c2.customer_profile_id,
        customer_name: c2.customer_name,
        common_items
      };
    });

    res.status(200).json(similarCustomers);
return;
  } catch (error) {
    console.error('推薦相似顧客時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

export default router;
