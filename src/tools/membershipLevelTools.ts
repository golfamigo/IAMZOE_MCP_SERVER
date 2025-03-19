import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';

// 接口定義
export interface MembershipLevel {
  membership_level_id: string;
  business_id: string;
  membership_level_name: string;
  membership_level_description?: string;
  membership_level_benefits?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMembershipLevelParams {
  business_id: string;
  membership_level_name: string;
  membership_level_description?: string;
  membership_level_benefits?: string;
}

export interface CreateMembershipLevelResult {
  membership_level_id: string;
}

export interface GetMembershipLevelParams {
  membership_level_id: string;
}

// 會員等級相關工具
export const membershipLevelTools = {
  // 創建會員等級
  createMembershipLevel: async (params: CreateMembershipLevelParams): Promise<CreateMembershipLevelResult> => {
    const { 
      business_id, 
      membership_level_name, 
      membership_level_description = '',
      membership_level_benefits = ''
    } = params;
    
    const membership_level_id = uuidv4();
    
    await neo4jClient.runQuery(
      `CREATE (ml:MembershipLevel {
        membership_level_id: $membership_level_id,
        business_id: $business_id,
        membership_level_name: $membership_level_name,
        membership_level_description: $membership_level_description,
        membership_level_benefits: $membership_level_benefits,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN ml`,
      { 
        membership_level_id, 
        business_id, 
        membership_level_name, 
        membership_level_description,
        membership_level_benefits
      }
    );
    
    return { membership_level_id };
  },
  
  // 獲取會員等級資訊
  getMembershipLevel: async (params: GetMembershipLevelParams): Promise<MembershipLevel> => {
    const { membership_level_id } = params;
    
    const result = await neo4jClient.runQuery(
      `MATCH (ml:MembershipLevel {membership_level_id: $membership_level_id})
       RETURN ml`,
      { membership_level_id }
    );
    
    if (result.records.length === 0) {
      throw new Error('Membership level not found');
    }
    
    return result.records[0].get('ml').properties;
  }
};
