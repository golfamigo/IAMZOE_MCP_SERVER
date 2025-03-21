import express, { Request, Response } from 'express';
import ajv from '../utils/ajv'; // Use centralized AJV
import { neo4jClient } from '../db';
import { toJsNumber } from '../utils/neo4jUtils';
import { authenticateApiKey } from '../middleware/auth';
import { 
  StaffServiceRequest, 
  StaffServiceResponse,
  StaffServiceListResponse,
  ErrorResponse
} from '../types/api';

const router = express.Router();

// 员工服务关系 Schema
const staffServiceSchema = {
  type: 'object',
  properties: {
    bookable_item_id: { type: 'string', format: 'uuid' }
  },
  required: ['bookable_item_id'],
  additionalProperties: false
};

// 验证函数
const validateStaffService = ajv.compile<StaffServiceRequest>(staffServiceSchema);

// 添加员工提供的服务 API
router.post('/staff/:staff_member_id/services', authenticateApiKey, async (req: Request, res: Response) => {
  const { staff_member_id } = req.params;
  const serviceData = req.body as StaffServiceRequest;

  // 验证请求数据
  if (!validateStaffService(serviceData)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '无效的请求参数',
      details: validateStaffService.errors
    } as ErrorResponse);
    return;
  }

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

    // 检查服务是否存在
    const serviceResult = await neo4jClient.runQuery(
      'MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id}) RETURN bi',
      { bookable_item_id: serviceData.bookable_item_id }
    );

    if (serviceResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的服务'
      } as ErrorResponse);
      return;
    }

    // 检查关系是否已存在
    const relationshipResult = await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id})-[r:CAN_PROVIDE]->(bi:BookableItem {bookable_item_id: $bookable_item_id})
       RETURN r`,
      { 
        staff_member_id, 
        bookable_item_id: serviceData.bookable_item_id 
      }
    );

    if (relationshipResult.records.length > 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '该员工已经能提供此服务'
      } as ErrorResponse);
      return;
    }

    // 创建员工与服务之间的关系
    await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id}), (bi:BookableItem {bookable_item_id: $bookable_item_id})
       CREATE (s)-[r:CAN_PROVIDE {created_at: datetime()}]->(bi)
       RETURN r`,
      { 
        staff_member_id, 
        bookable_item_id: serviceData.bookable_item_id 
      }
    );

    res.status(204).send();
    return;
  } catch (error) {
    console.error('添加员工提供的服务时发生错误:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '服务器发生错误'
    } as ErrorResponse);
    return;
  }
});

// 获取员工提供的服务列表 API
router.get('/staff/:staff_member_id/services', authenticateApiKey, async (req: Request, res: Response) => {
  const { staff_member_id } = req.params;

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

    // 获取员工提供的服务列表
    const countQuery = `
      MATCH (s:Staff {staff_member_id: $staff_member_id})-[:CAN_PROVIDE]->(bi:BookableItem)
      RETURN count(bi) as total`;
      
    const countResult = await neo4jClient.runQuery(countQuery, { staff_member_id });
    const total = toJsNumber(countResult.records[0].get('total'));

    const query = `
      MATCH (s:Staff {staff_member_id: $staff_member_id})-[:CAN_PROVIDE]->(bi:BookableItem)
      RETURN bi
      ORDER BY bi.bookable_item_name`;
      
    const result = await neo4jClient.runQuery(query, { staff_member_id });

    // 转换为响应格式
    const services = result.records.map(record => {
      const bi = record.get('bi').properties;
      return {
        staff_member_id,
        bookable_item_id: bi.bookable_item_id,
        bookable_item_name: bi.bookable_item_name,
        bookable_item_type_code: bi.bookable_item_type_code,
        bookable_item_duration: bi.bookable_item_duration
      } as StaffServiceResponse;
    });

    const response: StaffServiceListResponse = {
      total,
      services
    };

    res.status(200).json(response);
    return;
  } catch (error) {
    console.error('获取员工提供的服务列表时发生错误:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '服务器发生错误'
    } as ErrorResponse);
    return;
  }
});

// 删除员工提供的服务 API
router.delete('/staff/:staff_member_id/services/:bookable_item_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { staff_member_id, bookable_item_id } = req.params;

  try {
    // 检查关系是否存在
    const relationshipResult = await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id})-[r:CAN_PROVIDE]->(bi:BookableItem {bookable_item_id: $bookable_item_id})
       RETURN r`,
      { staff_member_id, bookable_item_id }
    );

    if (relationshipResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的关系'
      } as ErrorResponse);
      return;
    }

    // 删除关系
    await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id})-[r:CAN_PROVIDE]->(bi:BookableItem {bookable_item_id: $bookable_item_id})
       DELETE r`,
      { staff_member_id, bookable_item_id }
    );

    res.status(204).send();
    return;
  } catch (error) {
    console.error('删除员工提供的服务时发生错误:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '服务器发生错误'
    } as ErrorResponse);
    return;
  }
});

// 查找能提供指定服务的员工 API
router.get('/services/:bookable_item_id/staff', authenticateApiKey, async (req: Request, res: Response) => {
  const { bookable_item_id } = req.params;
  const { business_id } = req.query;

  if (!business_id) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '缺少必要参数: business_id'
    } as ErrorResponse);
    return;
  }

  try {
    // 检查服务是否存在
    const serviceResult = await neo4jClient.runQuery(
      'MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id}) RETURN bi',
      { bookable_item_id }
    );

    if (serviceResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的服务'
      } as ErrorResponse);
      return;
    }

    // 获取能提供该服务的员工列表
    const query = `
      MATCH (s:Staff {business_id: $business_id, staff_member_is_active: true})-[:CAN_PROVIDE]->(bi:BookableItem {bookable_item_id: $bookable_item_id})
      RETURN s
      ORDER BY s.staff_member_name`;
      
    const result = await neo4jClient.runQuery(query, { 
      business_id: business_id as string,
      bookable_item_id 
    });

    // 转换为响应格式
    const staff = result.records.map(record => {
      const s = record.get('s').properties;
      return {
        staff_member_id: s.staff_member_id,
        staff_member_name: s.staff_member_name,
        staff_member_email: s.staff_member_email,
        staff_member_phone: s.staff_member_phone
      };
    });

    res.status(200).json({
      total: staff.length,
      staff
    });
    return;
  } catch (error) {
    console.error('查找能提供指定服务的员工时发生错误:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '服务器发生错误'
    } as ErrorResponse);
    return;
  }
});

export default router;