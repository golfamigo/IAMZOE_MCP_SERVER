/**
 * 商家管理工具
 * 提供商家營業時間查詢等功能
 */
import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';
import { toJsNumber } from '../utils/neo4jUtils';
import { createToolDefinition } from '../utils/toolRegistration';
import { validateParams } from '../types/tool';

// 接口定義
export interface BusinessHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface GetBusinessHoursParams {
  business_id: string;
  day_of_week?: number;
}

export interface CreateBusinessParams {
  business_name: string;
  business_type: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  business_description?: string;
}

export interface CreateBusinessResult {
  business_id: string;
}

// 輸入模式定義
const getBusinessHoursSchema = {
  type: 'object',
  properties: {
    business_id: { type: 'string', description: '商家 ID' },
    day_of_week: { type: 'number', description: '星期幾 (0-6，0表示星期日)' }
  },
  required: ['business_id']
};

const createBusinessSchema = {
  type: 'object',
  properties: {
    business_name: { type: 'string', description: '商家名稱' },
    business_type: { type: 'string', description: '商家類型' },
    business_address: { type: 'string', description: '商家地址（可選）' },
    business_phone: { type: 'string', description: '商家電話號碼（可選）' },
    business_email: { type: 'string', description: '商家電子郵件（可選）' },
    business_description: { type: 'string', description: '商家描述（可選）' }
  },
  required: ['business_name', 'business_type']
};

/**
 * 獲取商家營業時間
 * @param params 查詢參數
 * @returns 營業時間列表
 */
export const getBusinessHoursImpl = async (params: GetBusinessHoursParams): Promise<BusinessHours[]> => {
  const { business_id, day_of_week } = params;
  
  let query = `
    MATCH (b:Business {business_id: $business_id})-[:HAS_BUSINESS_HOURS]->(bh:BusinessHours)
    WHERE 1=1
  `;
  
  if (day_of_week !== undefined) {
    query += ` AND bh.day_of_week = $day_of_week`;
  }
  
  query += ` RETURN bh ORDER BY bh.day_of_week`;
  
  const result = await neo4jClient.runQuery(
    query,
    { business_id, day_of_week }
  );
  
  return result.records.map(record => {
    const bh = record.get('bh').properties;
    return {
      day_of_week: toJsNumber(bh.day_of_week),
      start_time: bh.start_time,
      end_time: bh.end_time
    };
  });
};

/**
 * 創建商家節點
 * @param params 商家資訊
 * @returns 新建商家的 ID
 */
export const createBusinessImpl = async (params: CreateBusinessParams): Promise<CreateBusinessResult> => {
  // 驗證輸入參數
  validateParams(params, createBusinessSchema);
  
  const { 
    business_name, 
    business_type, 
    business_address = '', 
    business_phone = '', 
    business_email = '', 
    business_description = '' 
  } = params;
  
  const business_id = uuidv4();
  
  // 使用事務確保操作的原子性
  await neo4jClient.runInTransaction(async (tx) => {
    // 創建商家節點
    await tx.run(
      `CREATE (b:Business {
        business_id: $business_id,
        business_name: $business_name,
        business_type: $business_type,
        business_address: $business_address,
        business_phone: $business_phone,
        business_email: $business_email,
        business_description: $business_description,
        is_active: true,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN b`,
      { 
        business_id, 
        business_name, 
        business_type, 
        business_address, 
        business_phone, 
        business_email, 
        business_description 
      }
    );
    
    // 創建預設營業時間（週一至週五 9:00-18:00）
    for (let day_of_week = 1; day_of_week <= 5; day_of_week++) {
      await tx.run(
        `MATCH (b:Business {business_id: $business_id})
         CREATE (b)-[:HAS_BUSINESS_HOURS]->(bh:BusinessHours {
           business_hours_id: $business_hours_id,
           day_of_week: $day_of_week,
           start_time: '09:00:00',
           end_time: '18:00:00',
           created_at: datetime(),
           updated_at: datetime()
         })`,
        {
          business_id,
          business_hours_id: uuidv4(),
          day_of_week
        }
      );
    }
  });
  
  return { business_id };
};

// 建立標準化工具定義
export const getBusinessHours = createToolDefinition(
  'getBusinessHours',
  '獲取商家營業時間',
  getBusinessHoursSchema,
  getBusinessHoursImpl
);

export const createBusiness = createToolDefinition(
  'createBusiness',
  '建立新的商家',
  createBusinessSchema,
  createBusinessImpl
);

// 商家相關工具匯出
export const businessTools = {
  getBusinessHours,
  createBusiness
};
