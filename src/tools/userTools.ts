import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';

// 接口定義
export interface User {
  user_id: string;
  user_name: string;
  line_id?: string;
  line_notification_enabled: boolean;
  line_language_preference?: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserParams {
  user_name: string;
  line_id?: string;
  line_notification_enabled?: boolean;
  line_language_preference?: string;
  email: string;
  phone?: string;
}

export interface CreateUserResult {
  user_id: string;
}

export interface GetSuitableUsersForAdvertisementParams {
  business_id: string;
  advertisement_target_audience: string;
  limit?: number;
  offset?: number;
}

export interface UserForAdvertisement {
  user_id: string;
  user_name: string;
  customer_phone?: string;
}

// 使用者相關工具
export const userTools = {
  // 創建使用者
  createUser: async (params: CreateUserParams): Promise<CreateUserResult> => {
    const { 
      user_name, 
      line_id, 
      line_notification_enabled = true,
      line_language_preference,
      email,
      phone
    } = params;
    
    const user_id = uuidv4();
    
    await neo4jClient.runQuery(
      `CREATE (u:User {
        user_id: $user_id,
        user_name: $user_name,
        line_id: $line_id,
        line_notification_enabled: $line_notification_enabled,
        line_language_preference: $line_language_preference,
        email: $email,
        phone: $phone,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN u`,
      { 
        user_id, 
        user_name, 
        line_id: line_id || null,
        line_notification_enabled,
        line_language_preference: line_language_preference || null,
        email,
        phone: phone || null
      }
    );
    
    return { user_id };
  },
  
  // 獲取適合廣告的使用者
  getSuitableUsersForAdvertisement: async (params: GetSuitableUsersForAdvertisementParams): Promise<{total: number, users: UserForAdvertisement[]}> => {
    const { 
      business_id, 
      advertisement_target_audience,
      limit = 10,
      offset = 0
    } = params;
    
    // 解析廣告目標受眾條件
    let targetAudience;
    try {
      targetAudience = JSON.parse(advertisement_target_audience);
    } catch (error) {
      throw new Error('Invalid target audience format');
    }
    
    // 建立查詢條件
    let whereClause = `WHERE c.business_id = $business_id`;
    
    if (targetAudience.gender) {
      whereClause += ` AND c.gender = $gender`;
    }
    
    if (targetAudience.age_min) {
      whereClause += ` AND date().year - date(c.customer_birthdate).year >= $age_min`;
    }
    
    if (targetAudience.age_max) {
      whereClause += ` AND date().year - date(c.customer_birthdate).year <= $age_max`;
    }
    
    // 計算總數
    const countResult = await neo4jClient.runQuery(
      `MATCH (c:Customer)
       ${whereClause}
       RETURN count(c) as total`,
      { 
        business_id,
        gender: targetAudience.gender,
        age_min: targetAudience.age_min,
        age_max: targetAudience.age_max
      }
    );
    
    const total = countResult.records[0].get('total').toNumber();
    
    // 獲取符合條件的用戶
    const result = await neo4jClient.runQuery(
      `MATCH (c:Customer)-[:IS]-(u:User)
       ${whereClause}
       RETURN u.user_id as user_id, u.user_name as user_name, c.customer_phone as customer_phone
       ORDER BY u.created_at DESC
       SKIP $offset
       LIMIT $limit`,
      { 
        business_id,
        gender: targetAudience.gender,
        age_min: targetAudience.age_min,
        age_max: targetAudience.age_max,
        offset: offset,
        limit: limit
      }
    );
    
    const users = result.records.map(record => ({
      user_id: record.get('user_id'),
      user_name: record.get('user_name'),
      customer_phone: record.get('customer_phone')
    }));
    
    return { total, users };
  }
};
