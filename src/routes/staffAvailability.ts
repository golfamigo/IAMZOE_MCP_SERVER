import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ajv from '../utils/ajv'; // Use centralized AJV
import { neo4jClient } from '../db';
import { toJsNumber } from '../utils/neo4jUtils';
import { authenticateApiKey } from '../middleware/auth';
import { 
  CreateStaffAvailabilityRequest, 
  CreateStaffAvailabilityResponse,
  StaffAvailabilityResponse,
  StaffAvailabilityListResponse,
  ErrorResponse
} from '../types/api';

const router = express.Router();

// 建立员工可用性 Schema
const createStaffAvailabilitySchema = {
  type: 'object',
  properties: {
    staff_member_id: { type: 'string', format: 'uuid' },
    day_of_week: { type: 'integer', minimum: 0, maximum: 6 },
    start_time: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$' },
    end_time: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$' }
  },
  required: ['staff_member_id', 'day_of_week', 'start_time', 'end_time'],
  additionalProperties: false
};

// 驗證函式
const validateCreateStaffAvailability = ajv.compile<CreateStaffAvailabilityRequest>(createStaffAvailabilitySchema);

// 建立员工可用性 API
router.post('/staff-availability', authenticateApiKey, async (req: Request, res: Response) => {
  const availabilityData = req.body as CreateStaffAvailabilityRequest;

  // 驗證請求數據
  if (!validateCreateStaffAvailability(availabilityData)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '無效的請求參數',
      details: validateCreateStaffAvailability.errors
    } as ErrorResponse);
    return;
  }

  try {
    // 檢查员工是否存在
    const staffResult = await neo4jClient.runQuery(
      'MATCH (s:Staff {staff_member_id: $staff_member_id}) RETURN s',
      { staff_member_id: availabilityData.staff_member_id }
    );

    if (staffResult.records.length === 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '指定的员工不存在'
      } as ErrorResponse);
      return;
    }

    // 验证时间范围是否有效
    const startTime = availabilityData.start_time;
    const endTime = availabilityData.end_time;
    if (startTime >= endTime) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '结束时间必须晚于开始时间'
      } as ErrorResponse);
      return;
    }

    // 检查是否与现有可用性时间重叠
    const overlapResult = await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id})-[:HAS_AVAILABILITY]->(sa:StaffAvailability)
       WHERE sa.day_of_week = $day_of_week AND 
         NOT (sa.end_time <= $start_time OR sa.start_time >= $end_time)
       RETURN sa`,
      { 
        staff_member_id: availabilityData.staff_member_id,
        day_of_week: availabilityData.day_of_week,
        start_time: availabilityData.start_time,
        end_time: availabilityData.end_time
      }
    );

    if (overlapResult.records.length > 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '与现有可用性时间段重叠'
      } as ErrorResponse);
      return;
    }

    // 创建新的员工可用性
    const staff_availability_id = uuidv4();
    const createResult = await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id})
       CREATE (sa:StaffAvailability {
         staff_availability_id: $staff_availability_id,
         staff_member_id: $staff_member_id,
         day_of_week: $day_of_week,
         start_time: $start_time,
         end_time: $end_time,
         created_at: datetime(),
         updated_at: datetime()
       })
       CREATE (s)-[:HAS_AVAILABILITY]->(sa)
       RETURN sa`,
      {
        staff_availability_id,
        staff_member_id: availabilityData.staff_member_id,
        day_of_week: availabilityData.day_of_week,
        start_time: availabilityData.start_time,
        end_time: availabilityData.end_time
      }
    );

    if (createResult.records.length === 0) {
      res.status(500).json({
        error_code: 'SERVER_ERROR',
        message: '建立員工可用性失敗'
      } as ErrorResponse);
      return;
    }

    // 回傳成功結果
    res.status(201).json({ staff_availability_id } as CreateStaffAvailabilityResponse);
    return;
  } catch (error) {
    console.error('建立員工可用性時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
    return;
  }
});

// 获取员工可用性 API
router.get('/staff/:staff_member_id/availability', authenticateApiKey, async (req: Request, res: Response) => {
  const { staff_member_id } = req.params;
  const { day_of_week } = req.query;

  try {
    // 检查员工是否存在
    const staffResult = await neo4jClient.runQuery(
      'MATCH (s:Staff {staff_member_id: $staff_member_id}) RETURN s',
      { staff_member_id }
    );

    if (staffResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的员工'
      } as ErrorResponse);
      return;
    }

    // 构建查询
    let query = `MATCH (s:Staff {staff_member_id: $staff_member_id})-[:HAS_AVAILABILITY]->(sa:StaffAvailability)`;
    const params: Record<string, any> = { staff_member_id };

    // 如果指定了星期几，则过滤
    if (day_of_week !== undefined) {
      query += ` WHERE sa.day_of_week = $day_of_week`;
      params.day_of_week = parseInt(day_of_week as string, 10);
    }

    // 获取总数
    const countQuery = query + ` RETURN count(sa) as total`;
    const countResult = await neo4jClient.runQuery(countQuery, params);
    const total = toJsNumber(countResult.records[0].get('total'));

    // 获取可用性列表
    query += ` RETURN sa ORDER BY sa.day_of_week, sa.start_time`;
    const result = await neo4jClient.runQuery(query, params);

    // 转换为响应格式
    const availabilities = result.records.map(record => {
      const sa = record.get('sa').properties;
      return {
        staff_availability_id: sa.staff_availability_id,
        staff_member_id: sa.staff_member_id,
        day_of_week: toJsNumber(sa.day_of_week),
        start_time: sa.start_time,
        end_time: sa.end_time
      } as StaffAvailabilityResponse;
    });

    const response: StaffAvailabilityListResponse = {
      total,
      availabilities
    };

    res.status(200).json(response);
    return;
  } catch (error) {
    console.error('获取员工可用性时发生错误:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
    return;
  }
});

// 更新员工可用性 API
router.put('/staff-availability/:staff_availability_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { staff_availability_id } = req.params;
  const updateData = req.body;

  try {
    // 检查可用性是否存在
    const availabilityResult = await neo4jClient.runQuery(
      'MATCH (sa:StaffAvailability {staff_availability_id: $staff_availability_id}) RETURN sa',
      { staff_availability_id }
    );

    if (availabilityResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的可用性记录'
      } as ErrorResponse);
      return;
    }

    // 构建更新查询
    let updateQuery = 'MATCH (sa:StaffAvailability {staff_availability_id: $staff_availability_id}) ';
    let setClause = 'SET sa.updated_at = datetime() ';
    const params: Record<string, any> = { staff_availability_id };

    // 动态添加更新字段
    if (updateData.day_of_week !== undefined) {
      if (updateData.day_of_week < 0 || updateData.day_of_week > 6) {
        res.status(400).json({
          error_code: 'BAD_REQUEST',
          message: 'day_of_week 必须在 0-6 范围内'
        } as ErrorResponse);
        return;
      }
      setClause += ', sa.day_of_week = $day_of_week';
      params.day_of_week = updateData.day_of_week;
    }

    if (updateData.start_time) {
      setClause += ', sa.start_time = $start_time';
      params.start_time = updateData.start_time;
    }

    if (updateData.end_time) {
      setClause += ', sa.end_time = $end_time';
      params.end_time = updateData.end_time;
    }

    // 如果同时更新了开始和结束时间，验证时间范围
    if (updateData.start_time && updateData.end_time) {
      if (updateData.start_time >= updateData.end_time) {
        res.status(400).json({
          error_code: 'BAD_REQUEST',
          message: '结束时间必须晚于开始时间'
        } as ErrorResponse);
        return;
      }
    }

    // 执行更新
    updateQuery += setClause + ' RETURN sa';
    await neo4jClient.runQuery(updateQuery, params);

    res.status(204).send();
    return;
  } catch (error) {
    console.error('更新员工可用性时发生错误:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
    return;
  }
});

// 删除员工可用性 API
router.delete('/staff-availability/:staff_availability_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { staff_availability_id } = req.params;

  try {
    // 检查可用性是否存在
    const availabilityResult = await neo4jClient.runQuery(
      'MATCH (sa:StaffAvailability {staff_availability_id: $staff_availability_id}) RETURN sa',
      { staff_availability_id }
    );

    if (availabilityResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的可用性记录'
      } as ErrorResponse);
      return;
    }

    // 删除可用性记录及其关系
    await neo4jClient.runQuery(
      `MATCH (sa:StaffAvailability {staff_availability_id: $staff_availability_id})
       OPTIONAL MATCH (sa)-[r]-()
       DELETE r, sa`,
      { staff_availability_id }
    );

    res.status(204).send();
    return;
  } catch (error) {
    console.error('删除员工可用性时发生错误:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
    return;
  }
});

export default router;