import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ajv from '../utils/ajv'; // Use centralized AJV
import { neo4jClient } from '../db';
import { authenticateApiKey } from '../middleware/auth';
import { 
  CreateNotificationRequest, 
  CreateNotificationResponse,
  NotificationResponse,
  NotificationListResponse,
  ErrorResponse
} from '../types/api';

const router = express.Router();

// 创建通知 Schema
const createNotificationSchema = {
  type: 'object',
  properties: {
    notification_type: { type: 'string', enum: ['email', 'sms', 'line'] },
    notification_content: { type: 'string', maxLength: 1000 },
    recipient_user_ids: { 
      type: 'array',
      items: { type: 'string', format: 'uuid' },
      minItems: 1
    },
    booking_id: { type: 'string', format: 'uuid' }
  },
  required: ['notification_type', 'notification_content', 'recipient_user_ids'],
  additionalProperties: false
};

// 验证函数
const validateCreateNotification = ajv.compile<CreateNotificationRequest>(createNotificationSchema);

// 创建通知 API
router.post('/notifications', authenticateApiKey, async (req: Request, res: Response) => {
  const notificationData = req.body as CreateNotificationRequest;

  // 验证请求数据
  if (!validateCreateNotification(notificationData)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '无效的请求参数',
      details: validateCreateNotification.errors
    } as ErrorResponse);
    return;
  }

  try {
    // 验证接收者用户ID是否存在
    for (const userId of notificationData.recipient_user_ids) {
      const userResult = await neo4jClient.runQuery(
        'MATCH (u:User {user_id: $user_id}) RETURN u',
        { user_id: userId }
      );

      if (userResult.records.length === 0) {
        res.status(400).json({
          error_code: 'BAD_REQUEST',
          message: `接收者ID ${userId} 不存在`
        } as ErrorResponse);
        return;
      }
    }

    // 如果提供了booking_id，验证预约是否存在
    if (notificationData.booking_id) {
      const bookingResult = await neo4jClient.runQuery(
        'MATCH (b:Booking {booking_id: $booking_id}) RETURN b',
        { booking_id: notificationData.booking_id }
      );

      if (bookingResult.records.length === 0) {
        res.status(400).json({
          error_code: 'BAD_REQUEST',
          message: '指定的预约不存在'
        } as ErrorResponse);
        return;
      }
    }

    // 创建新的通知记录
    const notification_id = uuidv4();
    
    // 创建通知节点
    const createResult = await neo4jClient.runQuery(
      `CREATE (n:Notification {
        notification_id: $notification_id,
        notification_type: $notification_type,
        notification_content: $notification_content,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN n`,
      {
        notification_id,
        notification_type: notificationData.notification_type,
        notification_content: notificationData.notification_content
      }
    );

    if (createResult.records.length === 0) {
      res.status(500).json({
        error_code: 'SERVER_ERROR',
        message: '创建通知失败'
      } as ErrorResponse);
      return;
    }

    // 如果有关联的预约，创建关系
    if (notificationData.booking_id) {
      await neo4jClient.runQuery(
        `MATCH (n:Notification {notification_id: $notification_id})
         MATCH (b:Booking {booking_id: $booking_id})
         CREATE (b)-[:HAS_NOTIFICATION]->(n)`,
        {
          notification_id,
          booking_id: notificationData.booking_id
        }
      );
    }

    // 为每个接收者创建关系
    for (const userId of notificationData.recipient_user_ids) {
      await neo4jClient.runQuery(
        `MATCH (n:Notification {notification_id: $notification_id})
         MATCH (u:User {user_id: $user_id})
         CREATE (u)-[:RECEIVED_NOTIFICATION]->(n)`,
        {
          notification_id,
          user_id: userId
        }
      );
    }

    // 返回成功结果
    res.status(201).json({ notification_id } as CreateNotificationResponse);
    return;
  } catch (error) {
    console.error('创建通知时发生错误:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '服务器发生错误'
    } as ErrorResponse);
    return;
  }
});

// 获取用户通知列表 API
router.get('/users/:user_id/notifications', authenticateApiKey, async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const { limit = '10', offset = '0' } = req.query;

  try {
    // 验证用户是否存在
    const userResult = await neo4jClient.runQuery(
      'MATCH (u:User {user_id: $user_id}) RETURN u',
      { user_id }
    );

    if (userResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的用户'
      } as ErrorResponse);
      return;
    }

    // 获取总数
    const countQuery = `
      MATCH (u:User {user_id: $user_id})-[:RECEIVED_NOTIFICATION]->(n:Notification)
      RETURN count(n) as total`;
      
    const countResult = await neo4jClient.runQuery(countQuery, { user_id });
    const total = countResult.records[0].get('total').toNumber();

    // 获取通知列表
    const query = `
      MATCH (u:User {user_id: $user_id})-[:RECEIVED_NOTIFICATION]->(n:Notification)
      OPTIONAL MATCH (b:Booking)-[:HAS_NOTIFICATION]->(n)
      RETURN n, b.booking_id as booking_id
      ORDER BY n.created_at DESC
      SKIP $offset LIMIT $limit`;
      
    const result = await neo4jClient.runQuery(query, { 
      user_id,
      offset: parseInt(offset as string, 10),
      limit: parseInt(limit as string, 10)
    });

    // 转换为响应格式
    const notifications = result.records.map(record => {
      const n = record.get('n').properties;
      const booking_id = record.get('booking_id');
      
      return {
        notification_id: n.notification_id,
        notification_type: n.notification_type,
        notification_content: n.notification_content,
        created_at: n.created_at.toString(),
        updated_at: n.updated_at.toString(),
        booking_id: booking_id || undefined
      } as NotificationResponse;
    });

    const response: NotificationListResponse = {
      total,
      notifications
    };

    res.status(200).json(response);
    return;
  } catch (error) {
    console.error('获取用户通知列表时发生错误:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '服务器发生错误'
    } as ErrorResponse);
    return;
  }
});

// 获取预约的通知列表 API
router.get('/bookings/:booking_id/notifications', authenticateApiKey, async (req: Request, res: Response) => {
  const { booking_id } = req.params;

  try {
    // 验证预约是否存在
    const bookingResult = await neo4jClient.runQuery(
      'MATCH (b:Booking {booking_id: $booking_id}) RETURN b',
      { booking_id }
    );

    if (bookingResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的预约'
      } as ErrorResponse);
      return;
    }

    // 获取通知列表
    const query = `
      MATCH (b:Booking {booking_id: $booking_id})-[:HAS_NOTIFICATION]->(n:Notification)
      RETURN n
      ORDER BY n.created_at DESC`;
      
    const result = await neo4jClient.runQuery(query, { booking_id });

    // 转换为响应格式
    const notifications = result.records.map(record => {
      const n = record.get('n').properties;
      
      return {
        notification_id: n.notification_id,
        notification_type: n.notification_type,
        notification_content: n.notification_content,
        created_at: n.created_at.toString(),
        updated_at: n.updated_at.toString(),
        booking_id: booking_id
      } as NotificationResponse;
    });

    const response: NotificationListResponse = {
      total: notifications.length,
      notifications
    };

    res.status(200).json(response);
    return;
  } catch (error) {
    console.error('获取预约通知列表时发生错误:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '服务器发生错误'
    } as ErrorResponse);
    return;
  }
});

// 删除通知 API
router.delete('/notifications/:notification_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { notification_id } = req.params;

  try {
    // 验证通知是否存在
    const notificationResult = await neo4jClient.runQuery(
      'MATCH (n:Notification {notification_id: $notification_id}) RETURN n',
      { notification_id }
    );

    if (notificationResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的通知'
      } as ErrorResponse);
      return;
    }

    // 删除通知及其关系
    await neo4jClient.runQuery(
      `MATCH (n:Notification {notification_id: $notification_id})
       OPTIONAL MATCH (n)-[r]-()
       DELETE r, n`,
      { notification_id }
    );

    res.status(204).send();
    return;
  } catch (error) {
    console.error('删除通知时发生错误:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '服务器发生错误'
    } as ErrorResponse);
    return;
  }
});

export default router;