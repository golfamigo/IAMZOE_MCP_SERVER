import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';

// 接口定義
export interface Staff {
  staff_member_id: string;
  business_id: string;
  staff_member_name: string;
  staff_member_email: string;
  staff_member_phone?: string;
  staff_member_hire_date?: string;
  staff_member_termination_date?: string;
  staff_member_is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffParams {
  business_id: string;
  staff_member_name: string;
  staff_member_email: string;
  staff_member_phone?: string;
  staff_member_hire_date?: string;
}

export interface CreateStaffResult {
  staff_member_id: string;
}

export interface GetStaffParams {
  staff_member_id: string;
}

// 員工相關工具
export const staffTools = {
  // 創建員工
  createStaff: async (params: CreateStaffParams): Promise<CreateStaffResult> => {
    const { 
      business_id, 
      staff_member_name, 
      staff_member_email,
      staff_member_phone,
      staff_member_hire_date
    } = params;
    
    const staff_member_id = uuidv4();
    
    await neo4jClient.runQuery(
      `CREATE (s:Staff {
        staff_member_id: $staff_member_id,
        business_id: $business_id,
        staff_member_name: $staff_member_name,
        staff_member_email: $staff_member_email,
        staff_member_phone: $staff_member_phone,
        staff_member_hire_date: $staff_member_hire_date,
        staff_member_is_active: true,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN s`,
      { 
        staff_member_id, 
        business_id, 
        staff_member_name, 
        staff_member_email,
        staff_member_phone: staff_member_phone || null,
        staff_member_hire_date: staff_member_hire_date || null
      }
    );
    
    return { staff_member_id };
  },
  
  // 獲取員工資訊
  getStaff: async (params: GetStaffParams): Promise<Staff> => {
    const { staff_member_id } = params;
    
    const result = await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id})
       RETURN s`,
      { staff_member_id }
    );
    
    if (result.records.length === 0) {
      throw new Error('Staff not found');
    }
    
    return result.records[0].get('s').properties;
  }
};
