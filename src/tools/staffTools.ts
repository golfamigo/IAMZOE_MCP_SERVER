/**
 * 員工管理工具
 * 提供員工的建立、查詢和排班功能
 */
import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';
import { throwIfNotFound, throwInvalidParam, throwBusinessLogicError } from '../utils/errorHandling';
import { validateParams } from '../types/tool';
import { createToolDefinition } from '../utils/toolRegistration';

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

// 工具輸入模式定義
const createStaffSchema = {
  type: 'object',
  properties: {
    business_id: { 
      type: 'string', 
      description: '商家 ID' 
    },
    staff_member_name: { 
      type: 'string', 
      description: '員工姓名' 
    },
    staff_member_email: { 
      type: 'string', 
      description: '員工電子郵件地址' 
    },
    staff_member_phone: { 
      type: 'string', 
      description: '員工聯絡電話（可選）' 
    },
    staff_member_hire_date: { 
      type: 'string', 
      description: '員工雇用日期，ISO 8601 格式（可選）' 
    }
  },
  required: ['business_id', 'staff_member_name', 'staff_member_email']
};

const getStaffSchema = {
  type: 'object',
  properties: {
    staff_member_id: { 
      type: 'string', 
      description: '員工 ID' 
    }
  },
  required: ['staff_member_id']
};

const addStaffAvailabilitySchema = {
  type: 'object',
  properties: {
    staff_member_id: { 
      type: 'string', 
      description: '員工 ID' 
    },
    day_of_week: { 
      type: 'number', 
      description: '星期幾（0-6，0=週日，1=週一，依此類推）',
      minimum: 0,
      maximum: 6
    },
    start_time: { 
      type: 'string', 
      description: '開始時間，HH:MM:SS 格式',
      pattern: '^([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)$'
    },
    end_time: { 
      type: 'string',

      description: '結束時間，HH:MM:SS 格式',
      pattern: '^([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)$'
    }
  },
  required: ['staff_member_id', 'day_of_week', 'start_time', 'end_time']
};

const assignServiceToStaffSchema = {
  type: 'object',
  properties: {
    staff_member_id: { 
      type: 'string', 
      description: '員工 ID' 
    },
    bookable_item_id: { 
      type: 'string', 
      description: '可預約項目 ID' 
    }
  },
  required: ['staff_member_id', 'bookable_item_id']
};

// 實作函數
/**
 * 創建新員工
 * @param params 員工資訊
 * @returns 新建員工的 ID
 */
export const createStaffImpl = async (params: CreateStaffParams): Promise<CreateStaffResult> => {
  // 驗證輸入參數
  validateParams(params, createStaffSchema);
  const { 
    business_id, 
    staff_member_name, 
    staff_member_email,
    staff_member_phone,
    staff_member_hire_date
  } = params;
  
  // 驗證電子郵件格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(staff_member_email)) {
    throwInvalidParam('電子郵件格式無效');
  }
  
  // 驗證雇用日期（如果提供的話）
  if (staff_member_hire_date) {
    const hireDate = new Date(staff_member_hire_date);
    if (isNaN(hireDate.getTime())) {
      throwInvalidParam('雇用日期格式無效，請使用 ISO 8601 格式');
    }
  }
  
  // 創建唯一 ID
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
};

/**
 * 獲取員工資訊
 * @param params 查詢參數
 * @returns 員工資訊
 */
export const getStaffImpl = async (params: GetStaffParams): Promise<Staff> => {
  // 驗證輸入參數
  validateParams(params, getStaffSchema);
  const { staff_member_id } = params;
  
  const result = await neo4jClient.runQuery(
    `MATCH (s:Staff {staff_member_id: $staff_member_id})
     RETURN s`,
    { staff_member_id }
  );
  
  if (result.records.length === 0) {
    throwIfNotFound('Staff', staff_member_id);
  }
  
  return result.records[0].get('s').properties;
};

/**
 * 添加員工可用性設定
 * @param params 可用性參數
 * @returns 新的可用性設定 ID
 */
export const addStaffAvailabilityImpl = async (params: AddStaffAvailabilityParams): Promise<AddStaffAvailabilityResult> => {
  // 驗證輸入參數
  validateParams(params, addStaffAvailabilitySchema);
  const { staff_member_id, day_of_week, start_time, end_time } = params;
  
  // 驗證員工是否存在
  const staffResult = await neo4jClient.runQuery(
    `MATCH (s:Staff {staff_member_id: $staff_member_id})
     RETURN s`,
    { staff_member_id }
  );
  
  if (staffResult.records.length === 0) {
    throwIfNotFound('Staff', staff_member_id);
  }
  
  // 驗證時間邏輯是否有效
  const startTimeParts = start_time.split(':').map(Number);
  const endTimeParts = end_time.split(':').map(Number);
  
  const startDate = new Date();
  startDate.setHours(startTimeParts[0], startTimeParts[1], startTimeParts[2]);
  
  const endDate = new Date();
  endDate.setHours(endTimeParts[0], endTimeParts[1], endTimeParts[2]);
  
  if (startDate >= endDate) {
    throwInvalidParam('結束時間必須晚於開始時間');
  }
  
  // 檢查是否與現有可用性時段重疊
  const overlapCheck = await neo4jClient.runQuery(
    `MATCH (s:Staff {staff_member_id: $staff_member_id})-[:HAS_AVAILABILITY]->(sa:StaffAvailability)
     WHERE sa.day_of_week = $day_of_week
     AND (
       (sa.start_time <= $start_time AND sa.end_time > $start_time) OR
       (sa.start_time < $end_time AND sa.end_time >= $end_time) OR
       (sa.start_time >= $start_time AND sa.end_time <= $end_time)
     )
     RETURN sa`,
    { staff_member_id, day_of_week, start_time, end_time }
  );
  
  if (overlapCheck.records.length > 0) {
    throwBusinessLogicError('新的可用性時段與現有時段重疊');
  }
  
  // 創建唯一 ID
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
};

/**
 * 為員工指定可提供的服務
 * @param params 服務指派參數
 */
export const assignServiceToStaffImpl = async (params: AssignServiceToStaffParams): Promise<void> => {
  // 驗證輸入參數
  validateParams(params, assignServiceToStaffSchema);
  const { staff_member_id, bookable_item_id } = params;
  
  // 驗證員工和服務是否存在且屬於同一商家
  const verifyResult = await neo4jClient.runQuery(
    `MATCH (s:Staff {staff_member_id: $staff_member_id})
     MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
     WHERE s.business_id = bi.business_id
     RETURN s, bi`,
    { staff_member_id, bookable_item_id }
  );
  
  if (verifyResult.records.length === 0) {
    throwBusinessLogicError('找不到員工或服務，或是員工和服務不屬於同一商家');
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
};

// 建立標準化工具定義
export const createStaff = createToolDefinition(
  'createStaff',
  '建立新員工記錄',
  createStaffSchema,
  createStaffImpl
);

export const getStaff = createToolDefinition(
  'getStaff',
  '獲取員工資訊',
  getStaffSchema,
  getStaffImpl
);

export const addStaffAvailability = createToolDefinition(
  'addStaffAvailability',
  '設定員工工作可用時段',
  addStaffAvailabilitySchema,
  addStaffAvailabilityImpl
);

export const assignServiceToStaff = createToolDefinition(
  'assignServiceToStaff',
  '將服務項目指派給員工提供',
  assignServiceToStaffSchema,
  assignServiceToStaffImpl
);

// 員工相關工具匯出
export const staffTools = {
  createStaff,
  getStaff,
  addStaffAvailability,
  assignServiceToStaff
};
