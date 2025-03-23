"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.membershipLevelTools = exports.assignMembershipLevel = exports.getMembershipLevel = exports.createMembershipLevel = exports.assignMembershipLevelImpl = exports.getMembershipLevelImpl = exports.createMembershipLevelImpl = void 0;
/**
 * 會員等級管理工具
 * 提供會員等級的建立、查詢和指派功能
 */
const uuid_1 = require("uuid");
const db_1 = require("../db");
const errorHandling_1 = require("../utils/errorHandling");
const tool_1 = require("../types/tool");
const toolRegistration_1 = require("../utils/toolRegistration");
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
const createMembershipLevelImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, createMembershipLevelSchema);
    const { business_id, membership_level_name, membership_level_description = '', membership_level_benefits = '' } = params;
    // 驗證資料
    if (membership_level_name.length > 100) {
        (0, errorHandling_1.throwInvalidParam)('membership_level_name 超過最大長度 (100)');
    }
    if (membership_level_description && membership_level_description.length > 500) {
        (0, errorHandling_1.throwInvalidParam)('membership_level_description 超過最大長度 (500)');
    }
    const membership_level_id = (0, uuid_1.v4)();
    try {
        await db_1.neo4jClient.runQuery(`CREATE (ml:MembershipLevel {
        membership_level_id: $membership_level_id,
        business_id: $business_id,
        membership_level_name: $membership_level_name,
        membership_level_description: $membership_level_description,
        membership_level_benefits: $membership_level_benefits,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN ml`, {
            membership_level_id,
            business_id,
            membership_level_name,
            membership_level_description,
            membership_level_benefits
        });
        // 建立會員等級與商家的關係
        await db_1.neo4jClient.runQuery(`MATCH (b:Business {business_id: $business_id})
       MATCH (ml:MembershipLevel {membership_level_id: $membership_level_id})
       CREATE (ml)-[:BELONGS_TO]->(b)`, { business_id, membership_level_id });
        return { membership_level_id };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw (0, errorHandling_1.throwBusinessLogicError)(`建立會員等級時發生錯誤: ${errorMessage}`);
    }
};
exports.createMembershipLevelImpl = createMembershipLevelImpl;
/**
 * 獲取會員等級資訊
 * @param params 會員等級參數
 * @returns 會員等級資訊
 */
const getMembershipLevelImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, getMembershipLevelSchema);
    const { membership_level_id } = params;
    const result = await db_1.neo4jClient.runQuery(`MATCH (ml:MembershipLevel {membership_level_id: $membership_level_id})
     RETURN ml`, { membership_level_id });
    if (result.records.length === 0) {
        (0, errorHandling_1.throwIfNotFound)(null, '會員等級');
    }
    return result.records[0].get('ml').properties;
};
exports.getMembershipLevelImpl = getMembershipLevelImpl;
/**
 * 將客戶指定到會員等級
 * @param params 指派參數
 */
const assignMembershipLevelImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, assignMembershipLevelSchema);
    const { customer_profile_id, membership_level_id, membership_start_date = new Date().toISOString().split('T')[0], membership_expiry_date = null } = params;
    // 首先檢查客戶和會員等級是否存在
    const verifyResult = await db_1.neo4jClient.runQuery(`MATCH (c:Customer {customer_profile_id: $customer_profile_id})
     MATCH (ml:MembershipLevel {membership_level_id: $membership_level_id})
     WHERE c.business_id = ml.business_id
     RETURN c, ml`, { customer_profile_id, membership_level_id });
    if (verifyResult.records.length === 0) {
        (0, errorHandling_1.throwBusinessLogicError)('找不到客戶或會員等級，或是客戶與會員等級不屬於同一商家');
    }
    try {
        // 先刪除現有的會員等級關係，以確保客戶只有一個會員等級
        await db_1.neo4jClient.runQuery(`MATCH (c:Customer {customer_profile_id: $customer_profile_id})-[r:HAS_MEMBERSHIP]->(:MembershipLevel)
       DELETE r`, { customer_profile_id });
        // 使用參數化查詢而不是模板字符串
        let cypher;
        let parameters = {
            customer_profile_id,
            membership_level_id,
            membership_start_date
        };
        if (membership_expiry_date) {
            cypher = `
        MATCH (c:Customer {customer_profile_id: $customer_profile_id})
        MATCH (ml:MembershipLevel {membership_level_id: $membership_level_id})
        CREATE (c)-[:HAS_MEMBERSHIP {
          membership_start_date: date($membership_start_date),
          membership_expiry_date: date($membership_expiry_date),
          created_at: datetime(),
          updated_at: datetime()
        }]->(ml)
      `;
            parameters.membership_expiry_date = membership_expiry_date;
        }
        else {
            cypher = `
        MATCH (c:Customer {customer_profile_id: $customer_profile_id})
        MATCH (ml:MembershipLevel {membership_level_id: $membership_level_id})
        CREATE (c)-[:HAS_MEMBERSHIP {
          membership_start_date: date($membership_start_date),
          membership_expiry_date: null,
          created_at: datetime(),
          updated_at: datetime()
        }]->(ml)
      `;
        }
        // 然後建立新的會員等級關係
        await db_1.neo4jClient.runQuery(cypher, parameters);
        // 添加返回值
        return { success: true };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        (0, errorHandling_1.throwBusinessLogicError)(`指派會員等級時發生錯誤: ${errorMessage}`);
    }
    return { success: true };
};
exports.assignMembershipLevelImpl = assignMembershipLevelImpl;
// 建立標準化工具定義
exports.createMembershipLevel = (0, toolRegistration_1.createToolDefinition)('createMembershipLevel', '建立新的會員等級', createMembershipLevelSchema, exports.createMembershipLevelImpl);
exports.getMembershipLevel = (0, toolRegistration_1.createToolDefinition)('getMembershipLevel', '獲取會員等級詳細資訊', getMembershipLevelSchema, exports.getMembershipLevelImpl);
exports.assignMembershipLevel = (0, toolRegistration_1.createToolDefinition)('assignMembershipLevel', '將客戶指派到特定的會員等級', assignMembershipLevelSchema, exports.assignMembershipLevelImpl);
// 會員等級相關工具匯出
exports.membershipLevelTools = {
    createMembershipLevel: exports.createMembershipLevel,
    getMembershipLevel: exports.getMembershipLevel,
    assignMembershipLevel: exports.assignMembershipLevel
};
