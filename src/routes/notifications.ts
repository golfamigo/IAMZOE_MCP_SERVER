import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ajv from '../utils/ajv';
import { neo4jClient } from '../db';
import { authenticateApiKey } from '../middleware/auth';
import { ErrorResponse } from '../types/api';

const router = express.Router();

// 建立通知 Schema
const createNotificationSchema = {
  type: 'object',
  properties: {
    booking_id: { type: 'string', format: 'uuid' },
    notification_type: { type: 'string', enum: ['email', 'sms', 'line'] },
    notification_content: { type: 'string', maxLength: 1000 }
  },
  required: ['booking_id', 'notification_type', 'notification_content'],
  additionalProperties: false
};

// 驗證函式
const validateCreateNotification = ajv.compile(createNotificationSchema);

// 建立通知 API
router.post('/notifications', authenticateApiKey, async (req: Request, res: Response) => {
  const notificationData = req.body;

  if (!validateCreateNotification(notificationData)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '無效的請求參數',
      details: validateCreateNotification.errors
    } as ErrorResponse);
    return;
  }

  try {
    // 檢查預約是否存在
    const bookingResult = await neo4jClient.runQuery(
      'MATCH (b:Booking {booking_id: $booking_id}) RETURN b',
      { booking_id: notificationData.booking_id }
    );

    if (bookingResult.records.length === 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '指定的預約不存在'
      } as ErrorResponse);
      return;
    }

    // 建立通知
    const notification_id = uuidv4();
    const createResult = await neo4jClient.runQuery(
      `CREATE (n:Notification {
        notification_id: $notification_id,
        notification_type: $notification_type,
        notification_content: $notification_content,
        created_at: datetime(),
        updated_at: datetime()
      })
      WITH n
      MATCH (b:Booking {booking_id: $booking_id})
      CREATE (b)-[:HAS_NOTIFICATION]->(n)
      RETURN n`,
      {
        notification_id,
        booking_id: notificationData.booking_id,
        notification_type: notificationData.notification_type,
        notification_content: notificationData.notification_content
      }
    );

    if (createResult.records.length === 0) {
      res.status(500).json({
        error_code: 'SERVER_ERROR',
        message: '建立通知失敗'
      } as ErrorResponse);
      return;
    }

    res.status(201).json({ notification_id });
  } catch (error) {
    console.error('建立通知時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
  }
});

export default router;