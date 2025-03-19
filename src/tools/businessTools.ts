import { neo4jClient } from '../db';

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

// 商家相關工具
export const businessTools = {
  // 獲取商家營業時間
  getBusinessHours: async (params: GetBusinessHoursParams): Promise<BusinessHours[]> => {
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
  }
};
