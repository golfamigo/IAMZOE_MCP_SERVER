"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userTools = exports.getSuitableUsersForAdvertisement = exports.createUser = exports.getSuitableUsersForAdvertisementImpl = exports.createUserImpl = void 0;
/**
 * 使用者管理工具
 * 提供使用者創建和查詢功能，包括廣告目標受眾篩選
 */
const uuid_1 = require("uuid");
const db_1 = require("../db");
const neo4jUtils_1 = require("../utils/neo4jUtils");
const toolRegistration_1 = require("../utils/toolRegistration");
const enhancedErrorHandling_1 = require("../utils/enhancedErrorHandling");
// 輸入模式定義
const createUserSchema = {
    type: 'object',
    properties: {
        user_name: {
            type: 'string',
            description: '使用者名稱',
            minLength: 1,
            maxLength: 100
        },
        line_id: {
            type: 'string',
            description: 'LINE ID'
        },
        line_notification_enabled: {
            type: 'boolean',
            description: '是否啟用 LINE 通知'
        },
        line_language_preference: {
            type: 'string',
            description: 'LINE 語言偏好',
            enum: ['zh-TW', 'en-US', 'ja-JP', 'ko-KR', 'zh-CN', 'th-TH']
        },
        email: {
            type: 'string',
            description: '電子郵件',
            format: 'email'
        },
        phone: {
            type: 'string',
            description: '電話號碼',
            pattern: '^[+]?[0-9]{8,15}$'
        }
    },
    required: ['user_name', 'email']
};
const getSuitableUsersForAdvertisementSchema = {
    type: 'object',
    properties: {
        business_id: {
            type: 'string',
            description: '商家 ID'
        },
        advertisement_target_audience: {
            type: 'string',
            description: '廣告目標受眾 JSON 字串'
        },
        limit: {
            type: 'number',
            description: '結果數量限制',
            minimum: 1,
            maximum: 100,
            default: 10
        },
        offset: {
            type: 'number',
            description: '結果偏移量',
            minimum: 0,
            default: 0
        }
    },
    required: ['business_id', 'advertisement_target_audience']
};
/**
 * 創建使用者
 * @param params 使用者資訊
 * @returns 新建使用者的 ID
 */
const createUserImpl = async (params) => {
    // 參數驗證在 standardizeToolExecution 中處理
    const { user_name, line_id, line_notification_enabled = true, line_language_preference, email, phone } = params;
    // 檢查電子郵件是否已存在
    try {
        const existingUserResult = await db_1.neo4jClient.runQuery(`MATCH (u:User {email: $email}) RETURN u`, { email });
        if (existingUserResult.records.length > 0) {
            (0, enhancedErrorHandling_1.throwParameterError)('此電子郵件已被使用', 'email', '未被使用的電子郵件', email);
        }
    }
    catch (error) {
        if (!(error instanceof Error && error.message.includes('此電子郵件已被使用'))) {
            (0, enhancedErrorHandling_1.throwDatabaseError)(error instanceof Error ? error.message : '查詢使用者時發生錯誤', '查詢', 'User');
        }
        throw error;
    }
    // 創建唯一 ID
    const user_id = (0, uuid_1.v4)();
    try {
        await db_1.neo4jClient.runQuery(`CREATE (u:User {
        user_id: $user_id,
        user_name: $user_name,
        line_id: $line_id,
        line_notification_enabled: $line_notification_enabled,
        line_language_preference: $line_language_preference,
        email: $email,
        phone: $phone,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN u`, {
            user_id,
            user_name,
            line_id: line_id || null,
            line_notification_enabled,
            line_language_preference: line_language_preference || null,
            email,
            phone: phone || null
        });
    }
    catch (error) {
        (0, enhancedErrorHandling_1.throwDatabaseError)(error instanceof Error ? error.message : '創建使用者時發生錯誤', '創建', 'User');
    }
    return { user_id };
};
exports.createUserImpl = createUserImpl;
/**
 * 獲取適合廣告的使用者
 * @param params 查詢參數
 * @returns 符合目標受眾條件的使用者列表及總數
 */
const getSuitableUsersForAdvertisementImpl = async (params) => {
    // 參數驗證在 standardizeToolExecution 中處理
    const { business_id, advertisement_target_audience, limit = 10, offset = 0 } = params;
    // 檢查商家是否存在
    try {
        const businessResult = await db_1.neo4jClient.runQuery(`MATCH (b:Business {business_id: $business_id}) RETURN b`, { business_id });
        if (businessResult.records.length === 0) {
            (0, enhancedErrorHandling_1.throwResourceNotFound)(business_id, 'Business');
        }
    }
    catch (error) {
        if (!(error instanceof Error && error.message.includes('找不到Business'))) {
            (0, enhancedErrorHandling_1.throwDatabaseError)(error instanceof Error ? error.message : '查詢商家時發生錯誤', '查詢', 'Business');
        }
        throw error;
    }
    // 解析廣告目標受眾條件
    let targetAudience;
    try {
        targetAudience = JSON.parse(advertisement_target_audience);
    }
    catch (error) {
        (0, enhancedErrorHandling_1.throwParameterError)('無效的目標受眾格式，必須是有效的 JSON 字串', 'advertisement_target_audience', '有效的 JSON 字串', advertisement_target_audience);
    }
    // 驗證目標受眾結構
    if (typeof targetAudience !== 'object' || targetAudience === null) {
        (0, enhancedErrorHandling_1.throwParameterError)('目標受眾必須是一個物件', 'advertisement_target_audience', '包含目標受眾條件的物件', typeof targetAudience);
    }
    // 建立查詢條件
    let whereClause = `WHERE c.business_id = $business_id`;
    const queryParams = {
        business_id,
        offset,
        limit
    };
    if (targetAudience.gender) {
        if (!['male', 'female', 'other', 'prefer_not_to_say'].includes(targetAudience.gender)) {
            (0, enhancedErrorHandling_1.throwParameterError)('無效的性別值', 'gender', 'male, female, other, prefer_not_to_say', targetAudience.gender);
        }
        whereClause += ` AND c.gender = $gender`;
        queryParams.gender = targetAudience.gender;
    }
    if (targetAudience.age_min !== undefined) {
        if (typeof targetAudience.age_min !== 'number' || targetAudience.age_min < 0) {
            (0, enhancedErrorHandling_1.throwParameterError)('最小年齡必須是非負數', 'age_min', '非負數', targetAudience.age_min);
        }
        whereClause += ` AND date().year - date(c.customer_birthdate).year >= $age_min`;
        queryParams.age_min = targetAudience.age_min;
    }
    if (targetAudience.age_max !== undefined) {
        if (typeof targetAudience.age_max !== 'number' || targetAudience.age_max < 0) {
            (0, enhancedErrorHandling_1.throwParameterError)('最大年齡必須是非負數', 'age_max', '非負數', targetAudience.age_max);
        }
        whereClause += ` AND date().year - date(c.customer_birthdate).year <= $age_max`;
        queryParams.age_max = targetAudience.age_max;
    }
    // 檢查年齡範圍邏輯
    if (targetAudience.age_min !== undefined && targetAudience.age_max !== undefined &&
        targetAudience.age_min > targetAudience.age_max) {
        (0, enhancedErrorHandling_1.throwParameterError)('最小年齡不能大於最大年齡', 'age_range', `age_min <= age_max`, `age_min (${targetAudience.age_min}) > age_max (${targetAudience.age_max})`);
    }
    try {
        // 計算總數
        const countResult = await db_1.neo4jClient.runQuery(`MATCH (c:Customer)
       ${whereClause}
       RETURN count(c) as total`, queryParams);
        const total = (0, neo4jUtils_1.toJsNumber)(countResult.records[0].get('total'));
        // 獲取符合條件的用戶
        const result = await db_1.neo4jClient.runQuery(`MATCH (c:Customer)-[:IS]-(u:User)
       ${whereClause}
       RETURN u.user_id as user_id, u.user_name as user_name, c.customer_phone as customer_phone
       ORDER BY u.created_at DESC
       SKIP $offset
       LIMIT $limit`, queryParams);
        const users = result.records.map(record => ({
            user_id: record.get('user_id'),
            user_name: record.get('user_name'),
            customer_phone: record.get('customer_phone')
        }));
        return { total, users };
    }
    catch (error) {
        (0, enhancedErrorHandling_1.throwDatabaseError)(error instanceof Error ? error.message : '查詢使用者時發生錯誤', '查詢', 'User');
    }
};
exports.getSuitableUsersForAdvertisementImpl = getSuitableUsersForAdvertisementImpl;
// 建立標準化工具定義
exports.createUser = (0, toolRegistration_1.createToolDefinition)('createUser', '創建新的使用者', createUserSchema, (0, enhancedErrorHandling_1.standardizeToolExecution)(exports.createUserImpl, createUserSchema, 'createUser'));
exports.getSuitableUsersForAdvertisement = (0, toolRegistration_1.createToolDefinition)('getSuitableUsersForAdvertisement', '獲取符合廣告目標受眾條件的使用者', getSuitableUsersForAdvertisementSchema, (0, enhancedErrorHandling_1.standardizeToolExecution)(exports.getSuitableUsersForAdvertisementImpl, getSuitableUsersForAdvertisementSchema, 'getSuitableUsersForAdvertisement'));
// 使用者相關工具匯出
exports.userTools = {
    createUser: exports.createUser,
    getSuitableUsersForAdvertisement: exports.getSuitableUsersForAdvertisement
};
