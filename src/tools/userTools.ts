/**
 * 使用者管理工具
 * 提供使用者創建和查詢功能，包括廣告目標受眾篩選
 */
import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';
import { toJsNumber } from '../utils/neo4jUtils';
import { createToolDefinition } from '../utils/toolRegistration';
import { validateParams } from '../types/tool';

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

// 輸入模式定義
const createUserSchema = {
  type: 'object',
  properties: {
    user_name: { type: 'string', description: '使用者名稱' },
    line_id: { type: 'string', description: 'LINE ID' },
    line_notification_enabled: { type: 'boolean', description: '是否啟用 LINE 通知' },
    line_language_preference: { type: 'string', description: 'LINE 語言偏好' },
    email: { type: 'string', description: '電子郵件' },
    phone: { type: 'string', description: '電話號碼' }
  },
  required: ['user_name', 'email']
};

const getSuitableUsersForAdvertisementSchema = {
  type: 'object',
  properties: {
    business_id: { type: 'string', description: '商家 ID' },
    advertisement_target_audience: { type: 'string', description: '廣告目標受眾 JSON 字串' },
    limit: { type: 'number', description: '結果數量限制' },
    offset: { type: 'number', description: '結果偏移量' }
  },
  required: ['business_id', 'advertisement_target_audience']
};

/**
 * 創建使用者
 * @param params 使用者資訊
 * @returns 新建使用者的 ID
 */
export const createUserImpl = async (params: CreateUserParams): Promise<CreateUserResult> => {
  // 驗證輸入參數
  validateParams(params, createUserSchema);
  
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
};

/**
 * 獲取適合廣告的使用者
 * @param params 查詢參數
 * @returns 符合目標受眾條件的使用者列表及總數
 */
export const getSuitableUsersForAdvertisementImpl = async (params: GetSuitableUsersForAdvertisementParams): Promise<{total: number, users: UserForAdvertisement[]}> => {
  // 驗證輸入參數
  validateParams(params, getSuitableUsersForAdvertisementSchema);
  
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
  
  const total = toJsNumber(countResult.records[0].get('total'));
  
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
};

// 建立標準化工具定義
export const createUser = createToolDefinition(
  'createUser',
  '創建新的使用者',
  createUserSchema,
  createUserImpl
);

export const getSuitableUsersForAdvertisement = createToolDefinition(
  'getSuitableUsersForAdvertisement',
  '獲取符合廣告目標受眾條件的使用者',
  getSuitableUsersForAdvertisementSchema,
  getSuitableUsersForAdvertisementImpl
);

// 使用者相關工具匯出
export const userTools = {
  createUser,
  getSuitableUsersForAdvertisement
};
