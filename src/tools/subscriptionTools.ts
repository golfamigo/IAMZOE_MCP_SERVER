/**
 * 訂閱管理工具
 * 提供定期預約訂閱的創建和管理功能
 */
import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';
import { createToolDefinition } from '../utils/toolRegistration';
import { validateParams } from '../types/tool';
import { throwIfNotFound, throwInvalidParam, throwBusinessLogicError } from '../utils/errorHandling';

// 接口定義
export interface Subscription {
  subscription_id: string;
  customer_profile_id: string;
  bookable_item_id: string;
  start_date: string;
  end_date?: string;
  frequency: string;
  time_of_day: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionParams {
  customer_profile_id: string;
  bookable_item_id: string;
  start_date: string;
  end_date?: string;
  frequency: string;
  time_of_day: string;
}

export interface CreateSubscriptionResult {
  subscription_id: string;
}

// 輸入模式定義
const createSubscriptionSchema = {
  type: 'object',
  properties: {
    customer_profile_id: { 
      type: 'string', 
      description: '客戶資料 ID' 
    },
    bookable_item_id: { 
      type: 'string', 
      description: '可預約項目 ID' 
    },
    start_date: { 
      type: 'string', 
      description: '訂閱開始日期，YYYY-MM-DD 格式' 
    },
    end_date: { 
      type: 'string', 
      description: '訂閱結束日期，YYYY-MM-DD 格式（可選，若未提供則表示永久訂閱）' 
    },
    frequency: { 
      type: 'string', 
      description: '訂閱頻率，例如：daily, weekly, monthly, yearly' 
    },
    time_of_day: { 
      type: 'string', 
      description: '每次預約的時間，HH:MM:SS 格式' 
    }
  },
  required: ['customer_profile_id', 'bookable_item_id', 'start_date', 'frequency', 'time_of_day']
};

/**
 * 創建訂閱
 * @param params 訂閱資訊
 * @returns 新建訂閱的 ID
 */
export const createSubscriptionImpl = async (params: CreateSubscriptionParams): Promise<CreateSubscriptionResult> => {
  // 驗證輸入參數
  validateParams(params, createSubscriptionSchema);
  
  const { 
    customer_profile_id, 
    bookable_item_id, 
    start_date,
    end_date,
    frequency,
    time_of_day
  } = params;
  
  // 驗證日期格式
  try {
    const startDate = new Date(start_date);
    if (isNaN(startDate.getTime())) {
      throwInvalidParam('開始日期格式無效，請使用 YYYY-MM-DD 格式');
    }
    
    if (end_date) {
      const endDate = new Date(end_date);
      if (isNaN(endDate.getTime())) {
        throwInvalidParam('結束日期格式無效，請使用 YYYY-MM-DD 格式');
      }
      
      if (endDate <= startDate) {
        throwInvalidParam('結束日期必須晚於開始日期');
      }
    }
  } catch (error) {
    throwInvalidParam('日期格式驗證失敗');
  }
  
  // 驗證頻率
  const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
  if (!validFrequencies.includes(frequency)) {
    throwInvalidParam(`頻率必須是以下值之一: ${validFrequencies.join(', ')}`);
  }
  
  // 驗證時間格式
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
  if (!timeRegex.test(time_of_day)) {
    throwInvalidParam('時間格式無效，請使用 HH:MM:SS 格式');
  }
  
  // 驗證客戶和可預約項目是否存在
  const verifyResult = await neo4jClient.runQuery(
    `MATCH (c:Customer {customer_profile_id: $customer_profile_id})
     MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
     WHERE c.business_id = bi.business_id
     RETURN c, bi`,
    { customer_profile_id, bookable_item_id }
  );
  
  if (verifyResult.records.length === 0) {
    throwBusinessLogicError('找不到客戶或可預約項目，或是客戶與可預約項目不屬於同一商家');
  }
  
  const subscription_id = uuidv4();
  
  await neo4jClient.runQuery(
    `CREATE (s:Subscription {
      subscription_id: $subscription_id,
      customer_profile_id: $customer_profile_id,
      bookable_item_id: $bookable_item_id,
      start_date: date($start_date),
      end_date: ${end_date ? 'date($end_date)' : 'null'},
      frequency: $frequency,
      time_of_day: time($time_of_day),
      created_at: datetime(),
      updated_at: datetime()
    }) RETURN s`,
    { 
      subscription_id, 
      customer_profile_id, 
      bookable_item_id, 
      start_date,
      end_date,
      frequency,
      time_of_day
    }
  );
  
  // 建立關係
  await neo4jClient.runQuery(
    `MATCH (s:Subscription {subscription_id: $subscription_id})
     MATCH (c:Customer {customer_profile_id: $customer_profile_id})
     MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
     CREATE (c)-[:HAS_SUBSCRIPTION]->(s)-[:FOR_ITEM]->(bi)`,
    { subscription_id, customer_profile_id, bookable_item_id }
  );
  
  // 獲取商家ID並建立訂閱與商家的關係
  const businessResult = await neo4jClient.runQuery(
    `MATCH (c:Customer {customer_profile_id: $customer_profile_id})
     RETURN c.business_id as business_id`,
    { customer_profile_id }
  );
  
  if (businessResult.records.length > 0) {
    const business_id = businessResult.records[0].get('business_id');
    
    // 建立訂閱與商家的關係
    await neo4jClient.runQuery(
      `MATCH (s:Subscription {subscription_id: $subscription_id})
       MATCH (b:Business {business_id: $business_id})
       CREATE (s)-[:BELONGS_TO]->(b)`,
      { subscription_id, business_id }
    );
  }
  
  return { subscription_id };
};

// 建立標準化工具定義
export const createSubscription = createToolDefinition(
  'createSubscription',
  '創建定期預約訂閱',
  createSubscriptionSchema,
  createSubscriptionImpl
);

// 訂閱相關工具匯出
export const subscriptionTools = {
  createSubscription
};
