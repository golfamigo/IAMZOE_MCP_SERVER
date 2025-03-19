import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';

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

// 顧客相關工具
export const customerTools = {
  // 創建顧客
  createCustomer: async (params: CreateCustomerParams): Promise<CreateCustomerResult> => {
    const { 
      business_id, 
      customer_name, 
      customer_email,
      customer_phone,
      customer_birthdate,
      gender
    } = params;
    
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
    
    return { customer_profile_id };
  },
  
  // 獲取顧客資訊
  getCustomer: async (params: GetCustomerParams): Promise<Customer> => {
    const { customer_profile_id } = params;
    
    const result = await neo4jClient.runQuery(
      `MATCH (c:Customer {customer_profile_id: $customer_profile_id})
       RETURN c`,
      { customer_profile_id }
    );
    
    if (result.records.length === 0) {
      throw new Error('Customer not found');
    }
    
    return result.records[0].get('c').properties;
  }
};
