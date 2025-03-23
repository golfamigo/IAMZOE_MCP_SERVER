"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRelationshipTools = exports.getUserRelationship = exports.createUserRelationship = exports.getUserRelationshipImpl = exports.createUserRelationshipImpl = void 0;
/**
 * 使用者關係管理工具
 * 提供使用者之間關係的創建和查詢功能
 */
const uuid_1 = require("uuid");
const db_1 = require("../db");
const toolRegistration_1 = require("../utils/toolRegistration");
const tool_1 = require("../types/tool");
const errorHandling_1 = require("../utils/errorHandling");
// 輸入模式定義
const createUserRelationshipSchema = {
    type: 'object',
    properties: {
        user_id_1: {
            type: 'string',
            description: '第一個使用者 ID'
        },
        user_id_2: {
            type: 'string',
            description: '第二個使用者 ID'
        },
        relationship_type: {
            type: 'string',
            description: '關係類型，例如：friend, family, colleague 等'
        }
    },
    required: ['user_id_1', 'user_id_2', 'relationship_type']
};
const getUserRelationshipSchema = {
    type: 'object',
    properties: {
        user_id_1: {
            type: 'string',
            description: '第一個使用者 ID'
        },
        user_id_2: {
            type: 'string',
            description: '第二個使用者 ID'
        }
    },
    required: ['user_id_1', 'user_id_2']
};
/**
 * 創建使用者關係
 * @param params 關係資訊
 * @returns 新建關係的 ID
 */
const createUserRelationshipImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, createUserRelationshipSchema);
    const { user_id_1, user_id_2, relationship_type } = params;
    // 驗證使用者是否存在
    const usersResult = await db_1.neo4jClient.runQuery(`MATCH (u1:User {user_id: $user_id_1})
     MATCH (u2:User {user_id: $user_id_2})
     RETURN u1, u2`, { user_id_1, user_id_2 });
    if (usersResult.records.length === 0) {
        (0, errorHandling_1.throwBusinessLogicError)('找不到指定的使用者');
    }
    // 檢查是否已存在關係
    const existingResult = await db_1.neo4jClient.runQuery(`MATCH (ur:UserRelationship)
     WHERE (ur.user_id_1 = $user_id_1 AND ur.user_id_2 = $user_id_2)
        OR (ur.user_id_1 = $user_id_2 AND ur.user_id_2 = $user_id_1)
     RETURN ur`, { user_id_1, user_id_2 });
    if (existingResult.records.length > 0) {
        (0, errorHandling_1.throwBusinessLogicError)('這兩個使用者之間已存在關係');
    }
    // 驗證關係類型
    const validRelationshipTypes = ['friend', 'family', 'colleague', 'partner', 'other'];
    if (!validRelationshipTypes.includes(relationship_type) && !relationship_type.startsWith('custom_')) {
        (0, errorHandling_1.throwInvalidParam)(`關係類型必須是以下值之一: ${validRelationshipTypes.join(', ')}，或以 'custom_' 開頭的自定義類型`);
    }
    const user_relationship_id = (0, uuid_1.v4)();
    await db_1.neo4jClient.runQuery(`CREATE (ur:UserRelationship {
      user_relationship_id: $user_relationship_id,
      user_id_1: $user_id_1,
      user_id_2: $user_id_2,
      relationship_type: $relationship_type,
      created_at: datetime(),
      updated_at: datetime()
    }) RETURN ur`, {
        user_relationship_id,
        user_id_1,
        user_id_2,
        relationship_type
    });
    // 建立使用者與關係的連結
    await db_1.neo4jClient.runQuery(`MATCH (u1:User {user_id: $user_id_1})
     MATCH (u2:User {user_id: $user_id_2})
     MATCH (ur:UserRelationship {user_relationship_id: $user_relationship_id})
     CREATE (u1)-[:HAS_RELATIONSHIP]->(ur)
     CREATE (u2)-[:HAS_RELATIONSHIP]->(ur)`, { user_id_1, user_id_2, user_relationship_id });
    return { user_relationship_id };
};
exports.createUserRelationshipImpl = createUserRelationshipImpl;
/**
 * 獲取使用者關係
 * @param params 查詢參數
 * @returns 使用者關係資訊，如果不存在則返回 null
 */
const getUserRelationshipImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, getUserRelationshipSchema);
    const { user_id_1, user_id_2 } = params;
    const result = await db_1.neo4jClient.runQuery(`MATCH (ur:UserRelationship)
     WHERE (ur.user_id_1 = $user_id_1 AND ur.user_id_2 = $user_id_2)
        OR (ur.user_id_1 = $user_id_2 AND ur.user_id_2 = $user_id_1)
     RETURN ur`, { user_id_1, user_id_2 });
    if (result.records.length === 0) {
        return null;
    }
    return result.records[0].get('ur').properties;
};
exports.getUserRelationshipImpl = getUserRelationshipImpl;
// 建立標準化工具定義
exports.createUserRelationship = (0, toolRegistration_1.createToolDefinition)('createUserRelationship', '創建使用者之間的關係', createUserRelationshipSchema, exports.createUserRelationshipImpl);
exports.getUserRelationship = (0, toolRegistration_1.createToolDefinition)('getUserRelationship', '獲取兩個使用者之間的關係', getUserRelationshipSchema, exports.getUserRelationshipImpl);
// 使用者關係相關工具匯出
exports.userRelationshipTools = {
    createUserRelationship: exports.createUserRelationship,
    getUserRelationship: exports.getUserRelationship
};
