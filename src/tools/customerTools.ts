/**
 * 顧客管理工具
 * 提供顧客的建立和查詢功能
 */
import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';
import { throwIfNotFound, throwInvalidParam } from '../utils/errorHandling';
import { validateParams } from '../types/tool';
import { createToolDefinition } from '../utils/toolRegistration';

// 接口定義
export interface Customer {
  customer_profile_id: string;
  business_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_birthdate?: string;
  gender?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerParams {
  business_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_birthdate?: string;
  gender?: string;
}

export interface CreateCustomerResult {
  customer_profile_id: string;
}

export interface GetCustomerParams {
  customer_profile_id: string;
}

// 工具輸入模式定義
const createCustomerSchema = {
  type: 'object',
  properties: {
    business_id: { 
      type: 'string', 
      description: '商家 ID' 
    },
    customer_name: { 
      type: 'string', 
      description: '顧客姓名' 
    },
    customer_email: { 
      type: 'string', 
      description: '顧客電子郵件' 
    },
    customer_phone: { 
      type: 'string', 
      description: '顧客電話號碼（可選）' 
    },
    customer_birthdate: { 
      type: 'string', 
      description: '顧客生日，ISO 8601 格式（可選）' 
    },
    gender: { 
      type: 'string', 
      description: '性別（可選）',
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    }
  },
  required: ['business_id', 'customer_name', 'customer_email']
};

const getCustomerSchema = {
  type: 'object',
  properties: {
    customer_profile_id: { 
      type: 'string', 
      description: '顧客資料 ID' 
    }
  },
  required: ['customer_profile_id']
};

// 實作函數
/**
 * 創建新顧客
 * @param params 顧客資訊
 * @returns 新建顧客的 ID
 */
export const createCustomerImpl = async (params: CreateCustomerParams): Promise<CreateCustomerResult> => {
  // 驗證輸入參數
  validateParams(params, createCustomerSchema);
  const { 
    business_id, 
    customer_name, 
    customer_email,
    customer_phone,
    customer_birthdate,
    gender
  } = params;
  
  // 驗證電子郵件格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer_email)) {
    throwInvalidParam('電子郵件格式無效');
  }
  
  // 如果提供了生日，驗證格式和合理性
  if (customer_birthdate) {
    const birthDate = new Date(customer_birthdate);
    if (isNaN(birthDate.getTime())) {
      throwInvalidParam('生日格式無效，請使用 ISO 8601 格式');
    }
    
    const now = new Date();
    const minAge = new Date();
    minAge.setFullYear(now.getFullYear() - 120); // 假設最大年齡為 120 歲
    
    if (birthDate > now || birthDate < minAge) {
      throwInvalidParam('生日日期不合理');
    }
  }
  
  // 創建唯一 ID
  const customer_profile_id = uuidv4();
  
  await neo4jClient.runQuery(
    `CREATE (c:Customer {
      customer_profile_id: $customer_profile_id,
      business_id: $business_id,
      customer_name: $customer_name,
      customer_email: $customer_email,
      customer_phone: $customer_phone,
      customer_birthdate: $customer_birthdate,
      gender: $gender,
      created_at: datetime(),
      updated_at: datetime()
    }) RETURN c`,
    { 
      customer_profile_id, 
      business_id, 
      customer_name, 
      customer_email,
      customer_phone,
      customer_birthdate: customer_birthdate ? customer_birthdate : null,
      gender: gender || null
    }
  );
  
  // 建立顧客與商家的關係
  await neo4jClient.runQuery(
    `MATCH (b:Business {business_id: $business_id})
     MATCH (c:Customer {customer_profile_id: $customer_profile_id})
     CREATE (c)-[:BELONGS_TO]->(b)`,
    { business_id, customer_profile_id }
  );
  
  return { customer_profile_id };
};

/**
 * 獲取顧客資訊
 * @param params 查詢參數
 * @returns 顧客資訊
 */
export const getCustomerImpl = async (params: GetCustomerParams): Promise<Customer> => {
  // 驗證輸入參數
  validateParams(params, getCustomerSchema);
  const { customer_profile_id } = params;
  
  const result = await neo4jClient.runQuery(
    `MATCH (c:Customer {customer_profile_id: $customer_profile_id})
     RETURN c`,
    { customer_profile_id }
  );
  
  if (result.records.length === 0) {
    throwIfNotFound('Customer', customer_profile_id);
  }
  
  return result.records[0].get('c').properties;
};

// 建立標準化工具定義
export const createCustomer = createToolDefinition(
  'createCustomer',
  '建立新的顧客資料',
  createCustomerSchema,
  createCustomerImpl
);

export const getCustomer = createToolDefinition(
  'getCustomer',
  '獲取單一顧客的詳細資料',
  getCustomerSchema,
  getCustomerImpl
);

// 顧客相關工具匯出
export const customerTools = {
  createCustomer,
  getCustomer
};
