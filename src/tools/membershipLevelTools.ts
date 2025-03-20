/**
 * 會員等級管理工具
 * 提供會員等級的建立、查詢和指派功能
 */
import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';
import { throwIfNotFound, throwInvalidParam, throwBusinessLogicError } from '../utils/errorHandling';
import { validateParams } from '../types/tool';
import { createToolDefinition } from '../utils/toolRegistration';

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

// 工具輸入模式定義
const createMembershipLevelSchema = {
  type: 'object',
  properties: {
    business_id: { type: 'string', description: '商家 ID' },
    membership_level_name: { type: 'string', description: '會員等級名稱' },
    membership_level_description: { type: 'string', description: '會員等級描述' },
    membership_level_benefits: { type: 'string', description: '會員等級權益說明' }
  },
  required: ['business_id', 'membership_level_name']
};

const getMembershipLevelSchema = {
  type: 'object',
  properties: {
    membership_level_id: { type: 'string', description: '會員等級 ID' }
  },
  required: ['membership_level_id']
};

const assignMembershipLevelSchema = {
  type: 'object',
  properties: {
    customer_profile_id: { type: 'string', description: '客戶資料 ID' },
    membership_level_id: { type: 'string', description: '會員等級 ID' },
    membership_start_date: { type: 'string', description: '會員開始日期 (ISO 格式，如 2025-01-01)，預設為當前日期' },
    membership_expiry_date: { type: 'string', description: '會員到期日期 (ISO 格式)，若未提供則表示永久會員' }
  },
  required: ['customer_profile_id', 'membership_level_id']
};

// 實作函數
/**
 * 建立新會員等級
 * @param params 會員等級資訊
 * @returns 新建會員等級的 ID
 */
export const createMembershipLevelImpl = async (params: CreateMembershipLevelParams): Promise<CreateMembershipLevelResult> => {
  // 驗證輸入參數
  validateParams(params, createMembershipLevelSchema);
  
  const { 
    business_id, 
    membership_level_name, 
    membership_level_description = '',
    membership_level_benefits = ''
  } = params;
  
  // 驗證資料
  if (membership_level_name.length > 100) {
    throwInvalidParam('membership_level_name 超過最大長度 (100)');
  }
  
  if (membership_level_description && membership_level_description.length > 500) {
    throwInvalidParam('membership_level_description 超過最大長度 (500)');
  }
  
  const membership_level_id = uuidv4();
  
  try {
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw throwBusinessLogicError(`建立會員等級時發生錯誤: ${errorMessage}`);
  }
};

/**
 * 獲取會員等級資訊
 * @param params 會員等級參數
 * @returns 會員等級資訊
 */
export const getMembershipLevelImpl = async (params: GetMembershipLevelParams): Promise<MembershipLevel> => {
  // 驗證輸入參數
  validateParams(params, getMembershipLevelSchema);
  
  const { membership_level_id } = params;
  
  const result = await neo4jClient.runQuery(
    `MATCH (ml:MembershipLevel {membership_level_id: $membership_level_id})
     RETURN ml`,
    { membership_level_id }
  );
  
  if (result.records.length === 0) {
    throwIfNotFound(null, '會員等級');
  }
  
  return result.records[0].get('ml').properties;
};

/**
 * 將客戶指定到會員等級
 * @param params 指派參數
 */
export const assignMembershipLevelImpl = async (params: AssignMembershipLevelParams): Promise<void> => {
  // 驗證輸入參數
  validateParams(params, assignMembershipLevelSchema);
  
  const { 
    customer_profile_id, 
    membership_level_id,
    membership_start_date = new Date().toISOString().split('T')[0],
    membership_expiry_date = null
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
    throwBusinessLogicError('找不到客戶或會員等級，或是客戶與會員等級不屬於同一商家');
  }
  
  try {
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throwBusinessLogicError(`指派會員等級時發生錯誤: ${errorMessage}`);
  }
};

// 建立標準化工具定義
export const createMembershipLevel = createToolDefinition(
  'createMembershipLevel',
  '建立新的會員等級',
  createMembershipLevelSchema,
  createMembershipLevelImpl
);

export const getMembershipLevel = createToolDefinition(
  'getMembershipLevel',
  '獲取會員等級詳細資訊',
  getMembershipLevelSchema,
  getMembershipLevelImpl
);

export const assignMembershipLevel = createToolDefinition(
  'assignMembershipLevel',
  '將客戶指派到特定的會員等級',
  assignMembershipLevelSchema,
  assignMembershipLevelImpl
);

// 會員等級相關工具匯出
export const membershipLevelTools = {
  createMembershipLevel,
  getMembershipLevel,
  assignMembershipLevel
};
