"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const ajv_1 = __importDefault(require("../utils/ajv")); // Use centralized AJV
const db_1 = require("../db");
const neo4jUtils_1 = require("../utils/neo4jUtils");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// 建立使用者關係 Schema
const createUserRelationshipSchema = {
    type: 'object',
    properties: {
        user_id_1: { type: 'string', format: 'uuid' },
        user_id_2: { type: 'string', format: 'uuid' },
        relationship_type: { type: 'string', enum: ['friend', 'follow', 'block'] }
    },
    required: ['user_id_1', 'user_id_2', 'relationship_type'],
    additionalProperties: false
};
// 更新使用者關係 Schema
const updateUserRelationshipSchema = {
    type: 'object',
    properties: {
        relationship_type: { type: 'string', enum: ['friend', 'follow', 'block'] }
    },
    required: ['relationship_type'],
    additionalProperties: false
};
// 驗證函式
const validateCreateUserRelationship = ajv_1.default.compile(createUserRelationshipSchema);
const validateUpdateUserRelationship = ajv_1.default.compile(updateUserRelationshipSchema);
// 建立使用者關係 API
router.post('/user_relationships', auth_1.authenticateApiKey, async (req, res) => {
    const relationshipData = req.body;
    // 驗證請求數據
    if (!validateCreateUserRelationship(relationshipData)) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '無效的請求參數',
            details: validateCreateUserRelationship.errors
        });
        return;
    }
    try {
        // 檢查使用者 1 是否存在
        const user1Result = await db_1.neo4jClient.runQuery('MATCH (u:User {user_id: $user_id}) RETURN u', { user_id: relationshipData.user_id_1 });
        if (user1Result.records.length === 0) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '指定的使用者 1 不存在'
            });
            return;
        }
        // 檢查使用者 2 是否存在
        const user2Result = await db_1.neo4jClient.runQuery('MATCH (u:User {user_id: $user_id}) RETURN u', { user_id: relationshipData.user_id_2 });
        if (user2Result.records.length === 0) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '指定的使用者 2 不存在'
            });
            return;
        }
        // 檢查是否為自己建立關係
        if (relationshipData.user_id_1 === relationshipData.user_id_2) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '無法與自己建立關係'
            });
            return;
        }
        // 檢查是否已存在關係
        const existingResult = await db_1.neo4jClient.runQuery(`MATCH (u1:User {user_id: $user_id_1})-[r:RELATES_TO {relationship_type: $relationship_type}]->(u2:User {user_id: $user_id_2})
       RETURN r`, {
            user_id_1: relationshipData.user_id_1,
            user_id_2: relationshipData.user_id_2,
            relationship_type: relationshipData.relationship_type
        });
        if (existingResult.records.length > 0) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '已存在相同類型的關係'
            });
            return;
        }
        // 創建新的使用者關係
        const user_relationship_id = (0, uuid_1.v4)();
        const createResult = await db_1.neo4jClient.runQuery(`MATCH (u1:User {user_id: $user_id_1}), (u2:User {user_id: $user_id_2})
       CREATE (u1)-[r:RELATES_TO {
         user_relationship_id: $user_relationship_id,
         relationship_type: $relationship_type,
         created_at: datetime(),
         updated_at: datetime()
       }]->(u2)
       RETURN r`, {
            user_id_1: relationshipData.user_id_1,
            user_id_2: relationshipData.user_id_2,
            user_relationship_id,
            relationship_type: relationshipData.relationship_type
        });
        if (createResult.records.length === 0) {
            res.status(500).json({
                error_code: 'SERVER_ERROR',
                message: '建立使用者關係失敗'
            });
            return;
        }
        // 回傳成功結果
        res.status(201).json({ user_relationship_id });
        return;
    }
    catch (error) {
        console.error('建立使用者關係時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 取得使用者關係 API
router.get('/user_relationships', auth_1.authenticateApiKey, async (req, res) => {
    const { user_id_1, user_id_2 } = req.query;
    if (!user_id_1 || !user_id_2) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '缺少必要參數: user_id_1 和 user_id_2'
        });
        return;
    }
    try {
        // 查詢使用者關係
        const relationshipResult = await db_1.neo4jClient.runQuery(`MATCH (u1:User {user_id: $user_id_1})-[r:RELATES_TO]->(u2:User {user_id: $user_id_2})
       RETURN r`, {
            user_id_1: user_id_1,
            user_id_2: user_id_2
        });
        if (relationshipResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的使用者關係'
            });
            return;
        }
        // 轉換為響應格式
        const relationship = relationshipResult.records[0].get('r').properties;
        const relationshipResponse = {
            user_relationship_id: relationship.user_relationship_id,
            user_id_1: user_id_1,
            user_id_2: user_id_2,
            relationship_type: relationship.relationship_type
        };
        res.status(200).json(relationshipResponse);
        return;
    }
    catch (error) {
        console.error('取得使用者關係時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 更新使用者關係 API
router.put('/user_relationships', auth_1.authenticateApiKey, async (req, res) => {
    const { user_id_1, user_id_2 } = req.query;
    const updateData = req.body;
    if (!user_id_1 || !user_id_2) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '缺少必要參數: user_id_1 和 user_id_2'
        });
        return;
    }
    // 驗證請求數據
    if (!validateUpdateUserRelationship(updateData)) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '無效的請求參數',
            details: validateUpdateUserRelationship.errors
        });
        return;
    }
    try {
        // 查詢使用者關係是否存在
        const relationshipResult = await db_1.neo4jClient.runQuery(`MATCH (u1:User {user_id: $user_id_1})-[r:RELATES_TO]->(u2:User {user_id: $user_id_2})
       RETURN r`, {
            user_id_1: user_id_1,
            user_id_2: user_id_2
        });
        if (relationshipResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的使用者關係'
            });
            return;
        }
        // 更新使用者關係
        await db_1.neo4jClient.runQuery(`MATCH (u1:User {user_id: $user_id_1})-[r:RELATES_TO]->(u2:User {user_id: $user_id_2})
       SET r.relationship_type = $relationship_type,
           r.updated_at = datetime()`, {
            user_id_1: user_id_1,
            user_id_2: user_id_2,
            relationship_type: updateData.relationship_type
        });
        res.status(204).send();
        return;
    }
    catch (error) {
        console.error('更新使用者關係時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 刪除使用者關係 API
router.delete('/user_relationships', auth_1.authenticateApiKey, async (req, res) => {
    const { user_id_1, user_id_2 } = req.query;
    if (!user_id_1 || !user_id_2) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '缺少必要參數: user_id_1 和 user_id_2'
        });
        return;
    }
    try {
        // 查詢使用者關係是否存在
        const relationshipResult = await db_1.neo4jClient.runQuery(`MATCH (u1:User {user_id: $user_id_1})-[r:RELATES_TO]->(u2:User {user_id: $user_id_2})
       RETURN r`, {
            user_id_1: user_id_1,
            user_id_2: user_id_2
        });
        if (relationshipResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的使用者關係'
            });
            return;
        }
        // 刪除使用者關係
        await db_1.neo4jClient.runQuery(`MATCH (u1:User {user_id: $user_id_1})-[r:RELATES_TO]->(u2:User {user_id: $user_id_2})
       DELETE r`, {
            user_id_1: user_id_1,
            user_id_2: user_id_2
        });
        res.status(204).send();
        return;
    }
    catch (error) {
        console.error('刪除使用者關係時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 查詢使用者關係列表 API
router.get('/users/:user_id/relationships', auth_1.authenticateApiKey, async (req, res) => {
    const { user_id } = req.params;
    const { relationship_type, limit = '10', offset = '0' } = req.query;
    try {
        // 構建查詢
        let query = '';
        const params = {
            user_id,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10)
        };
        // 按關係類型查詢
        if (relationship_type) {
            if (!['friend', 'follow', 'follower', 'block'].includes(relationship_type)) {
                res.status(400).json({
                    error_code: 'BAD_REQUEST',
                    message: '無效的關係類型，必須是 friend, follow, follower 或 block'
                });
                return;
            }
            // 如果是查詢粉絲(追蹤者)
            if (relationship_type === 'follower') {
                query = `MATCH (u:User {user_id: $user_id})<-[r:RELATES_TO {relationship_type: 'follow'}]-(follower:User)
                 RETURN follower, r`;
            }
            else {
                // 其他類型
                params.relationship_type = relationship_type;
                query = `MATCH (u:User {user_id: $user_id})-[r:RELATES_TO {relationship_type: $relationship_type}]->(related:User)
                 RETURN related, r`;
            }
        }
        else {
            // 返回所有關係
            query = `MATCH (u:User {user_id: $user_id})-[r:RELATES_TO]->(related:User)
               RETURN related, r`;
        }
        // 總數查詢
        const countQuery = `${query.split('RETURN')[0]} RETURN count(r) as total`;
        const countResult = await db_1.neo4jClient.runQuery(countQuery, params);
        const total = (0, neo4jUtils_1.toJsNumber)(countResult.records[0].get('total'));
        // 分頁查詢
        query += ` ORDER BY r.created_at DESC SKIP $offset LIMIT $limit`;
        const result = await db_1.neo4jClient.runQuery(query, params);
        // 轉換為響應格式
        const users = result.records.map(record => {
            const user = record.get('related') || record.get('follower');
            return {
                user_id: user.properties.user_id,
                user_name: user.properties.user_name
            };
        });
        const response = {
            total,
            users
        };
        res.status(200).json(response);
        return;
    }
    catch (error) {
        console.error('查詢使用者關係列表時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 查詢適合廣告的使用者列表 API
router.get('/users/suitable_for_advertisement', auth_1.authenticateApiKey, async (req, res) => {
    const { business_id, advertisement_target_audience, limit = '10', offset = '0' } = req.query;
    if (!business_id || !advertisement_target_audience) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '缺少必要參數: business_id 或 advertisement_target_audience'
        });
        return;
    }
    try {
        // 解析目標受眾
        let targetAudience;
        try {
            targetAudience = JSON.parse(advertisement_target_audience);
        }
        catch (e) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '目標受眾必須是有效的JSON格式'
            });
            return;
        }
        // 構建查詢條件
        let whereClause = '';
        const params = {
            business_id,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10)
        };
        // 根據不同條件構建查詢
        if (targetAudience.gender) {
            whereClause += ' AND c.gender = $gender';
            params.gender = targetAudience.gender;
        }
        // 如果有年齡區間
        if (targetAudience.age_min || targetAudience.age_max) {
            if (targetAudience.age_min) {
                const currentYear = new Date().getFullYear();
                const birthYearMax = currentYear - targetAudience.age_min;
                whereClause += ' AND date(c.customer_birthdate).year <= $birth_year_max';
                params.birth_year_max = birthYearMax;
            }
            if (targetAudience.age_max) {
                const currentYear = new Date().getFullYear();
                const birthYearMin = currentYear - targetAudience.age_max;
                whereClause += ' AND date(c.customer_birthdate).year >= $birth_year_min';
                params.birth_year_min = birthYearMin;
            }
        }
        // 構建查詢
        const query = `
      MATCH (b:Business {business_id: $business_id})<-[:BELONGS_TO]-(c:Customer)-[:BELONGS_TO]->(u:User)
      WHERE 1=1 ${whereClause}
      RETURN u, c
    `;
        // 總數查詢
        const countQuery = `${query.split('RETURN')[0]} RETURN count(u) as total`;
        const countResult = await db_1.neo4jClient.runQuery(countQuery, params);
        const total = (0, neo4jUtils_1.toJsNumber)(countResult.records[0].get('total'));
        // 分頁查詢
        const result = await db_1.neo4jClient.runQuery(query + ` ORDER BY c.created_at DESC SKIP $offset LIMIT $limit`, params);
        // 轉換為響應格式
        const users = result.records.map(record => {
            const user = record.get('u').properties;
            const customer = record.get('c').properties;
            return {
                user_id: user.user_id,
                user_name: user.user_name,
                customer_phone: customer.customer_phone
            };
        });
        const response = {
            total,
            users
        };
        res.status(200).json(response);
        return;
    }
    catch (error) {
        console.error('查詢適合廣告的使用者列表時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
exports.default = router;
