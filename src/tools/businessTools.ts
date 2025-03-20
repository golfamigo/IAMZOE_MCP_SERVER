/**
 * 商家管理工具
 * 提供商家營業時間查詢等功能
 */
import { neo4jClient } from '../db';
import { createToolDefinition } from '../utils/toolRegistration';

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

// 輸入模式定義
const getBusinessHoursSchema = {
  type: 'object',
  properties: {
    business_id: { type: 'string', description: '商家 ID' },
    day_of_week: { type: 'number', description: '星期幾 (0-6，0表示星期日)' }
  },
  required: ['business_id']
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
      day_of_week: bh.day_of_week.toNumber(),
      start_time: bh.start_time,
      end_time: bh.end_time
    };
  });
};

// 建立標準化工具定義
export const getBusinessHours = createToolDefinition(
  'getBusinessHours',
  '獲取商家營業時間',
  getBusinessHoursSchema,
  getBusinessHoursImpl
);

// 商家相關工具匯出
export const businessTools = {
  getBusinessHours
};
