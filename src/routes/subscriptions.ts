import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ajv from '../utils/ajv';
import { neo4jClient } from '../db';
import { authenticateApiKey } from '../middleware/auth';
import { ErrorResponse } from '../types/api';

interface SubscriptionData {
  customer_profile_id: string;
  bookable_item_id: string;
  start_date: string;
  end_date?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time_of_day: string;
}

const router = express.Router();

// 建立訂閱 Schema
const createSubscriptionSchema = {
  type: 'object',
  properties: {
    customer_profile_id: { type: 'string', format: 'uuid' },
    bookable_item_id: { type: 'string', format: 'uuid' },
    start_date: { type: 'string', format: 'date' },
    end_date: { type: 'string', format: 'date', nullable: true },
    frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
    time_of_day: { type: 'string', pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$' }
  },
  required: ['customer_profile_id', 'bookable_item_id', 'start_date', 'frequency', 'time_of_day'],
  additionalProperties: false
};

// 驗證函式
const validateCreateSubscription = ajv.compile(createSubscriptionSchema);

// 建立訂閱 API
router.post('/subscriptions', authenticateApiKey, async (req: Request, res: Response) => {
  const subscriptionData = req.body;

  if (!validateCreateSubscription(subscriptionData)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '無效的請求參數',
      details: validateCreateSubscription.errors
    } as ErrorResponse);
    return;
  }

  try {
    // 檢查顧客是否存在
    const customerResult = await neo4jClient.runQuery(
      'MATCH (c:Customer {customer_profile_id: $customer_profile_id}) RETURN c',
      { customer_profile_id: subscriptionData.customer_profile_id }
    );

    if (customerResult.records.length === 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '指定的顧客不存在'
      } as ErrorResponse);
      return;
    }

    // 檢查服務是否存在
    const serviceResult = await neo4jClient.runQuery(
      'MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id}) RETURN bi',
      { bookable_item_id: subscriptionData.bookable_item_id }
    );

    if (serviceResult.records.length === 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '指定的服務不存在'
      } as ErrorResponse);
      return;
    }

    // 檢查日期有效性
    const startDate = new Date(subscriptionData.start_date as string);
    const endDate = subscriptionData.end_date ? new Date(subscriptionData.end_date as string) : null;
    if (endDate && endDate <= startDate) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '結束日期必須晚於開始日期'
      } as ErrorResponse);
      return;
    }

    // 建立訂閱
    const subscription_id = uuidv4();
    const createResult = await neo4jClient.runQuery(
      `CREATE (s:Subscription {
        subscription_id: $subscription_id,
        customer_profile_id: $customer_profile_id,
        bookable_item_id: $bookable_item_id,
        start_date: date($start_date),
        end_date: $end_date,
        frequency: $frequency,
        time_of_day: time($time_of_day),
        created_at: datetime(),
        updated_at: datetime()
      })
      WITH s
      MATCH (c:Customer {customer_profile_id: $customer_profile_id})
      MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
      CREATE (c)-[:HAS_SUBSCRIPTION]->(s)
      CREATE (s)-[:SUBSCRIBES_TO]->(bi)
      RETURN s`,
      {
        subscription_id,
        customer_profile_id: subscriptionData.customer_profile_id,
        bookable_item_id: subscriptionData.bookable_item_id,
        start_date: subscriptionData.start_date,
        end_date: subscriptionData.end_date || null,
        frequency: subscriptionData.frequency,
        time_of_day: subscriptionData.time_of_day
      }
    );

    if (createResult.records.length === 0) {
      res.status(500).json({
        error_code: 'SERVER_ERROR',
        message: '建立訂閱失敗'
      } as ErrorResponse);
      return;
    }

    res.status(201).json({ subscription_id });
  } catch (error) {
    console.error('建立訂閱時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
  }
});

export default router;