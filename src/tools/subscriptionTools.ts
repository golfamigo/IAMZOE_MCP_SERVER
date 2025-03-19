import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';

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

// 訂閱相關工具
export const subscriptionTools = {
  // 創建訂閱
  createSubscription: async (params: CreateSubscriptionParams): Promise<CreateSubscriptionResult> => {
    const { 
      customer_profile_id, 
      bookable_item_id, 
      start_date,
      end_date,
      frequency,
      time_of_day
    } = params;
    
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
    
    return { subscription_id };
  }
};
