"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerTools = exports.getCustomer = exports.createCustomer = exports.getCustomerImpl = exports.createCustomerImpl = void 0;
/**
 * 顧客管理工具
 * 提供顧客的建立和查詢功能
 */
const uuid_1 = require("uuid");
const db_1 = require("../db");
const errorHandling_1 = require("../utils/errorHandling");
const tool_1 = require("../types/tool");
const toolRegistration_1 = require("../utils/toolRegistration");
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
const createCustomerImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, createCustomerSchema);
    const { business_id, customer_name, customer_email, customer_phone, customer_birthdate, gender } = params;
    // 驗證電子郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
        (0, errorHandling_1.throwInvalidParam)('電子郵件格式無效');
    }
    // 如果提供了生日，驗證格式和合理性
    if (customer_birthdate) {
        const birthDate = new Date(customer_birthdate);
        if (isNaN(birthDate.getTime())) {
            (0, errorHandling_1.throwInvalidParam)('生日格式無效，請使用 ISO 8601 格式');
        }
        const now = new Date();
        const minAge = new Date();
        minAge.setFullYear(now.getFullYear() - 120); // 假設最大年齡為 120 歲
        if (birthDate > now || birthDate < minAge) {
            (0, errorHandling_1.throwInvalidParam)('生日日期不合理');
        }
    }
    // 創建唯一 ID
    const customer_profile_id = (0, uuid_1.v4)();
    await db_1.neo4jClient.runQuery(`CREATE (c:Customer {
      customer_profile_id: $customer_profile_id,
      business_id: $business_id,
      customer_name: $customer_name,
      customer_email: $customer_email,
      customer_phone: $customer_phone,
      customer_birthdate: $customer_birthdate,
      gender: $gender,
      created_at: datetime(),
      updated_at: datetime()
    }) RETURN c`, {
        customer_profile_id,
        business_id,
        customer_name,
        customer_email,
        customer_phone,
        customer_birthdate: customer_birthdate ? customer_birthdate : null,
        gender: gender || null
    });
    // 建立顧客與商家的關係
    await db_1.neo4jClient.runQuery(`MATCH (b:Business {business_id: $business_id})
     MATCH (c:Customer {customer_profile_id: $customer_profile_id})
     CREATE (c)-[:BELONGS_TO]->(b)`, { business_id, customer_profile_id });
    return { customer_profile_id };
};
exports.createCustomerImpl = createCustomerImpl;
/**
 * 獲取顧客資訊
 * @param params 查詢參數
 * @returns 顧客資訊
 */
const getCustomerImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, getCustomerSchema);
    const { customer_profile_id } = params;
    const result = await db_1.neo4jClient.runQuery(`MATCH (c:Customer {customer_profile_id: $customer_profile_id})
     RETURN c`, { customer_profile_id });
    if (result.records.length === 0) {
        (0, errorHandling_1.throwIfNotFound)('Customer', customer_profile_id);
    }
    return result.records[0].get('c').properties;
};
exports.getCustomerImpl = getCustomerImpl;
// 建立標準化工具定義
exports.createCustomer = (0, toolRegistration_1.createToolDefinition)('createCustomer', '建立新的顧客資料', createCustomerSchema, exports.createCustomerImpl);
exports.getCustomer = (0, toolRegistration_1.createToolDefinition)('getCustomer', '獲取單一顧客的詳細資料', getCustomerSchema, exports.getCustomerImpl);
// 顧客相關工具匯出
exports.customerTools = {
    createCustomer: exports.createCustomer,
    getCustomer: exports.getCustomer
};
