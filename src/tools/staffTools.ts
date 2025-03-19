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

export interface StaffAvailability {
  staff_availability_id: string;
  staff_member_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface AddStaffAvailabilityParams {
  staff_member_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface AddStaffAvailabilityResult {
  staff_availability_id: string;
}

export interface AssignServiceToStaffParams {
  staff_member_id: string;
  bookable_item_id: string;
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
  },
  
  // 添加員工可用性設定
  addStaffAvailability: async (params: AddStaffAvailabilityParams): Promise<AddStaffAvailabilityResult> => {
    const { staff_member_id, day_of_week, start_time, end_time } = params;
    
    // 驗證員工是否存在
    const staffResult = await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id})
       RETURN s`,
      { staff_member_id }
    );
    
    if (staffResult.records.length === 0) {
      throw new Error('找不到該員工');
    }
    
    // 驗證日期和時間格式
    if (day_of_week < 0 || day_of_week > 6) {
      throw new Error('星期幾必須在 0-6 範圍內，其中 0=週日，1=週一，依此類推');
    }
    
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      throw new Error('時間必須為 HH:MM:SS 格式');
    }
    
    const startTimeParts = start_time.split(':').map(Number);
    const endTimeParts = end_time.split(':').map(Number);
    
    const startDate = new Date();
    startDate.setHours(startTimeParts[0], startTimeParts[1], startTimeParts[2]);
    
    const endDate = new Date();
    endDate.setHours(endTimeParts[0], endTimeParts[1], endTimeParts[2]);
    
    if (startDate >= endDate) {
      throw new Error('結束時間必須晚於開始時間');
    }
    
    const staff_availability_id = uuidv4();
    
    await neo4jClient.runQuery(
      `CREATE (sa:StaffAvailability {
        staff_availability_id: $staff_availability_id,
        staff_member_id: $staff_member_id,
        day_of_week: $day_of_week,
        start_time: $start_time,
        end_time: $end_time,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN sa`,
      { 
        staff_availability_id, 
        staff_member_id, 
        day_of_week, 
        start_time, 
        end_time 
      }
    );
    
    // 建立員工與可用性的關係
    await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id})
       MATCH (sa:StaffAvailability {staff_availability_id: $staff_availability_id})
       CREATE (s)-[:HAS_AVAILABILITY]->(sa)`,
      { staff_member_id, staff_availability_id }
    );
    
    return { staff_availability_id };
  },
  
  // 為員工指定可提供的服務
  assignServiceToStaff: async (params: AssignServiceToStaffParams): Promise<void> => {
    const { staff_member_id, bookable_item_id } = params;
    
    // 驗證員工和服務是否存在
    const verifyResult = await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id})
       MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
       WHERE s.business_id = bi.business_id
       RETURN s, bi`,
      { staff_member_id, bookable_item_id }
    );
    
    if (verifyResult.records.length === 0) {
      throw new Error('找不到員工或服務，或是員工和服務不屬於同一商家');
    }
    
    // 檢查關係是否已存在
    const existingResult = await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id})-[r:CAN_PROVIDE]->(bi:BookableItem {bookable_item_id: $bookable_item_id})
       RETURN r`,
      { staff_member_id, bookable_item_id }
    );
    
    if (existingResult.records.length > 0) {
      // 關係已存在，不需要再次建立
      return;
    }
    
    // 建立員工與服務的關係
    await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id})
       MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
       CREATE (s)-[:CAN_PROVIDE]->(bi)`,
      { staff_member_id, bookable_item_id }
    );
  }
};
