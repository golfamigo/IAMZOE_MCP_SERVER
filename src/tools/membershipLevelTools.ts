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

export interface AssignMembershipLevelParams {
  customer_profile_id: string;
  membership_level_id: string;
  membership_start_date?: string;  // 可選，預設為當前日期
  membership_expiry_date?: string;  // 可選，如果為空表示永久會員
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
  },
  
  // 將客戶指定到會員等級
  assignMembershipLevel: async (params: AssignMembershipLevelParams): Promise<void> => {
    const { 
      customer_profile_id, 
      membership_level_id,
      membership_start_date = new Date().toISOString().split('T')[0],  // 預設為當前日期
      membership_expiry_date = null  // 預設為空，表示永久會員
    } = params;
    
    // 首先檢查客戶和會員等級是否存在
    const verifyResult = await neo4jClient.runQuery(
      `MATCH (c:Customer {customer_profile_id: $customer_profile_id})
       MATCH (ml:MembershipLevel {membership_level_id: $membership_level_id})
       WHERE c.business_id = ml.business_id
       RETURN c, ml`,
      { customer_profile_id, membership_level_id }
    );
    
    if (verifyResult.records.length === 0) {
      throw new Error('找不到客戶或會員等級，或是客戶與會員等級不屬於同一商家');
    }
    
    // 先刪除現有的會員等級關係，以確保客戶只有一個會員等級
    await neo4jClient.runQuery(
      `MATCH (c:Customer {customer_profile_id: $customer_profile_id})-[r:HAS_MEMBERSHIP]->(:MembershipLevel)
       DELETE r`,
      { customer_profile_id }
    );
    
    // 然後建立新的會員等級關係
    await neo4jClient.runQuery(
      `MATCH (c:Customer {customer_profile_id: $customer_profile_id})
       MATCH (ml:MembershipLevel {membership_level_id: $membership_level_id})
       CREATE (c)-[:HAS_MEMBERSHIP {
         membership_start_date: date($membership_start_date),
         membership_expiry_date: ${membership_expiry_date ? 'date($membership_expiry_date)' : 'null'},
         created_at: datetime(),
         updated_at: datetime()
       }]->(ml)`,
      { 
        customer_profile_id, 
        membership_level_id,
        membership_start_date,
        membership_expiry_date
      }
    );
  }
};
