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
// 建立會員等級 Schema
const createMembershipLevelSchema = {
    type: 'object',
    properties: {
        business_id: { type: 'string', format: 'uuid' },
        membership_level_name: { type: 'string', maxLength: 255 },
        membership_level_description: { type: 'string', maxLength: 1000 },
        membership_level_benefits: { type: 'string', maxLength: 1000 }
    },
    required: ['business_id', 'membership_level_name'],
    additionalProperties: false
};
// 驗證函式
const validateCreateMembershipLevel = ajv_1.default.compile(createMembershipLevelSchema);
// 建立會員等級 API
router.post('/membership_levels', auth_1.authenticateApiKey, async (req, res) => {
    const membershipLevelData = req.body;
    // 驗證請求數據
    if (!validateCreateMembershipLevel(membershipLevelData)) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '無效的請求參數',
            details: validateCreateMembershipLevel.errors
        });
        return;
    }
    try {
        // 檢查 business_id 是否存在
        const businessResult = await db_1.neo4jClient.runQuery('MATCH (b:Business {business_id: $business_id}) RETURN b', { business_id: membershipLevelData.business_id });
        if (businessResult.records.length === 0) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '指定的商家不存在'
            });
            return;
        }
        // 檢查是否已存在相同名稱的會員等級
        const membershipLevelResult = await db_1.neo4jClient.runQuery('MATCH (m:MembershipLevel {business_id: $business_id, membership_level_name: $membership_level_name}) RETURN m', {
            business_id: membershipLevelData.business_id,
            membership_level_name: membershipLevelData.membership_level_name
        });
        if (membershipLevelResult.records.length > 0) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '該商家已存在相同名稱的會員等級'
            });
            return;
        }
        // 創建新的會員等級
        const membership_level_id = (0, uuid_1.v4)();
        const createResult = await db_1.neo4jClient.runQuery(`CREATE (m:MembershipLevel {
        membership_level_id: $membership_level_id,
        business_id: $business_id,
        membership_level_name: $membership_level_name,
        membership_level_description: $membership_level_description,
        membership_level_benefits: $membership_level_benefits,
        created_at: datetime(),
        updated_at: datetime()
      })
      WITH m
      MATCH (b:Business {business_id: $business_id})
      CREATE (m)-[:BELONGS_TO]->(b)
      RETURN m`, {
            membership_level_id,
            business_id: membershipLevelData.business_id,
            membership_level_name: membershipLevelData.membership_level_name,
            membership_level_description: membershipLevelData.membership_level_description || null,
            membership_level_benefits: membershipLevelData.membership_level_benefits || null
        });
        if (createResult.records.length === 0) {
            res.status(500).json({
                error_code: 'SERVER_ERROR',
                message: '建立會員等級失敗'
            });
            return;
        }
        // 回傳成功結果
        res.status(201).json({ membership_level_id });
        return;
    }
    catch (error) {
        console.error('建立會員等級時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 取得會員等級資訊 API
router.get('/membership_levels/:membership_level_id', auth_1.authenticateApiKey, async (req, res) => {
    const { membership_level_id } = req.params;
    try {
        // 查詢會員等級資訊
        const membershipLevelResult = await db_1.neo4jClient.runQuery('MATCH (m:MembershipLevel {membership_level_id: $membership_level_id}) RETURN m', { membership_level_id });
        if (membershipLevelResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的會員等級'
            });
            return;
        }
        // 轉換為響應格式
        const membershipLevel = membershipLevelResult.records[0].get('m').properties;
        const membershipLevelResponse = {
            membership_level_id: membershipLevel.membership_level_id,
            business_id: membershipLevel.business_id,
            membership_level_name: membershipLevel.membership_level_name,
            membership_level_description: membershipLevel.membership_level_description,
            membership_level_benefits: membershipLevel.membership_level_benefits
        };
        res.status(200).json(membershipLevelResponse);
        return;
    }
    catch (error) {
        console.error('取得會員等級資訊時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 更新會員等級資訊 API
router.put('/membership_levels/:membership_level_id', auth_1.authenticateApiKey, async (req, res) => {
    const { membership_level_id } = req.params;
    const updateData = req.body;
    // 驗證會員等級是否存在
    try {
        const membershipLevelResult = await db_1.neo4jClient.runQuery('MATCH (m:MembershipLevel {membership_level_id: $membership_level_id}) RETURN m', { membership_level_id });
        if (membershipLevelResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的會員等級'
            });
            return;
        }
        // 如果要更新名稱，檢查是否與其他會員等級重名
        if (updateData.membership_level_name) {
            const membershipLevel = membershipLevelResult.records[0].get('m').properties;
            const duplicateResult = await db_1.neo4jClient.runQuery(`MATCH (m:MembershipLevel {business_id: $business_id, membership_level_name: $membership_level_name})
         WHERE m.membership_level_id <> $membership_level_id
         RETURN m`, {
                business_id: membershipLevel.business_id,
                membership_level_name: updateData.membership_level_name,
                membership_level_id
            });
            if (duplicateResult.records.length > 0) {
                res.status(400).json({
                    error_code: 'BAD_REQUEST',
                    message: '該商家已存在相同名稱的會員等級'
                });
                return;
            }
        }
        // 構建更新查詢
        let updateQuery = 'MATCH (m:MembershipLevel {membership_level_id: $membership_level_id}) ';
        let setClause = 'SET m.updated_at = datetime() ';
        const params = { membership_level_id };
        // 動態添加更新欄位
        if (updateData.membership_level_name) {
            setClause += ', m.membership_level_name = $membership_level_name';
            params.membership_level_name = updateData.membership_level_name;
        }
        if (updateData.membership_level_description !== undefined) {
            setClause += ', m.membership_level_description = $membership_level_description';
            params.membership_level_description = updateData.membership_level_description;
        }
        if (updateData.membership_level_benefits !== undefined) {
            setClause += ', m.membership_level_benefits = $membership_level_benefits';
            params.membership_level_benefits = updateData.membership_level_benefits;
        }
        // 執行更新
        updateQuery += setClause + ' RETURN m';
        await db_1.neo4jClient.runQuery(updateQuery, params);
        res.status(204).send();
        return;
    }
    catch (error) {
        console.error('更新會員等級資訊時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 刪除會員等級 API
router.delete('/membership_levels/:membership_level_id', auth_1.authenticateApiKey, async (req, res) => {
    const { membership_level_id } = req.params;
    try {
        // 查詢會員等級是否存在
        const membershipLevelResult = await db_1.neo4jClient.runQuery('MATCH (m:MembershipLevel {membership_level_id: $membership_level_id}) RETURN m', { membership_level_id });
        if (membershipLevelResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的會員等級'
            });
            return;
        }
        // 檢查是否還有顧客屬於該會員等級
        const customerResult = await db_1.neo4jClient.runQuery(`MATCH (m:MembershipLevel {membership_level_id: $membership_level_id})<-[:HAS_MEMBERSHIP]-(c:Customer)
       RETURN c`, { membership_level_id });
        if (customerResult.records.length > 0) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '該會員等級下還有顧客，無法刪除'
            });
            return;
        }
        // 刪除會員等級與關聯關係
        await db_1.neo4jClient.runQuery(`MATCH (m:MembershipLevel {membership_level_id: $membership_level_id})
       OPTIONAL MATCH (m)-[r]-()
       DELETE r, m`, { membership_level_id });
        res.status(204).send();
        return;
    }
    catch (error) {
        console.error('刪除會員等級時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 查詢會員等級列表 API
router.get('/membership_levels', auth_1.authenticateApiKey, async (req, res) => {
    const { business_id, limit = '10', offset = '0' } = req.query;
    if (!business_id) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '缺少必要參數: business_id'
        });
        return;
    }
    try {
        // 構建查詢
        const query = `MATCH (m:MembershipLevel {business_id: $business_id}) RETURN m`;
        const params = {
            business_id,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10)
        };
        // 總數查詢
        const countResult = await db_1.neo4jClient.runQuery(query + ` RETURN count(m) as total`, params);
        const total = (0, neo4jUtils_1.toJsNumber)(countResult.records[0].get('total'));
        // 分頁查詢
        const result = await db_1.neo4jClient.runQuery(query + ` ORDER BY m.membership_level_name SKIP $offset LIMIT $limit`, params);
        // 轉換為響應格式
        const membershipLevels = result.records.map(record => {
            const m = record.get('m').properties;
            return {
                membership_level_id: m.membership_level_id,
                business_id: m.business_id,
                membership_level_name: m.membership_level_name,
                membership_level_description: m.membership_level_description,
                membership_level_benefits: m.membership_level_benefits
            };
        });
        const response = {
            total,
            membership_levels: membershipLevels
        };
        res.status(200).json(response);
        return;
    }
    catch (error) {
        console.error('查詢會員等級列表時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
exports.default = router;
