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
// 建立廣告 Schema
const createAdvertisementSchema = {
    type: 'object',
    properties: {
        business_id: { type: 'string', format: 'uuid' },
        advertisement_name: { type: 'string', maxLength: 255 },
        advertisement_description: { type: 'string', maxLength: 1000 },
        advertisement_image_url: { type: 'string', format: 'uri' },
        advertisement_landing_page_url: { type: 'string', format: 'uri' },
        advertisement_start_date: { type: 'string', format: 'date' },
        advertisement_end_date: { type: 'string', format: 'date' },
        advertisement_budget: { type: 'number', minimum: 0 },
        advertisement_target_audience: { type: 'string' }
    },
    required: [
        'business_id',
        'advertisement_name',
        'advertisement_description',
        'advertisement_image_url',
        'advertisement_landing_page_url',
        'advertisement_start_date',
        'advertisement_end_date',
        'advertisement_budget',
        'advertisement_target_audience'
    ],
    additionalProperties: false
};
// 審核廣告 Schema
const approveAdvertisementSchema = {
    type: 'object',
    properties: {
        approved: { type: 'boolean' },
        reason: { type: 'string' }
    },
    required: ['approved'],
    additionalProperties: false
};
// 驗證函式
const validateCreateAdvertisement = ajv_1.default.compile(createAdvertisementSchema);
const validateApproveAdvertisement = ajv_1.default.compile(approveAdvertisementSchema);
// 建立廣告 API
router.post('/advertisements', auth_1.authenticateApiKey, async (req, res) => {
    const advertisementData = req.body;
    // 驗證請求數據
    if (!validateCreateAdvertisement(advertisementData)) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '無效的請求參數',
            details: validateCreateAdvertisement.errors || []
        });
        return;
    }
    try {
        // 檢查 business_id 是否存在
        const businessResult = await db_1.neo4jClient.runQuery('MATCH (b:Business {business_id: $business_id}) RETURN b', { business_id: advertisementData.business_id });
        if (businessResult.records.length === 0) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '指定的商家不存在'
            });
            return;
        }
        // 驗證開始日期和結束日期
        const startDate = new Date(advertisementData.advertisement_start_date);
        const endDate = new Date(advertisementData.advertisement_end_date);
        if (endDate <= startDate) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '廣告結束日期必須晚於開始日期'
            });
            return;
        }
        // 驗證JSON格式的目標受眾
        try {
            JSON.parse(advertisementData.advertisement_target_audience);
        }
        catch (e) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '目標受眾必須是有效的JSON格式'
            });
            return;
        }
        // 創建新的廣告
        const advertisement_id = (0, uuid_1.v4)();
        const createResult = await db_1.neo4jClient.runQuery(`CREATE (a:Advertisement {
        advertisement_id: $advertisement_id,
        business_id: $business_id,
        advertisement_name: $advertisement_name,
        advertisement_description: $advertisement_description,
        advertisement_image_url: $advertisement_image_url,
        advertisement_landing_page_url: $advertisement_landing_page_url,
        advertisement_start_date: date($advertisement_start_date),
        advertisement_end_date: date($advertisement_end_date),
        advertisement_budget: $advertisement_budget,
        advertisement_target_audience: $advertisement_target_audience,
        advertisement_status: 'pending',
        created_at: datetime(),
        updated_at: datetime()
      })
      WITH a
      MATCH (b:Business {business_id: $business_id})
      CREATE (b)-[:HAS_ADVERTISEMENT]->(a)
      RETURN a`, {
            advertisement_id,
            business_id: advertisementData.business_id,
            advertisement_name: advertisementData.advertisement_name,
            advertisement_description: advertisementData.advertisement_description,
            advertisement_image_url: advertisementData.advertisement_image_url,
            advertisement_landing_page_url: advertisementData.advertisement_landing_page_url,
            advertisement_start_date: advertisementData.advertisement_start_date,
            advertisement_end_date: advertisementData.advertisement_end_date,
            advertisement_budget: advertisementData.advertisement_budget,
            advertisement_target_audience: advertisementData.advertisement_target_audience
        });
        if (createResult.records.length === 0) {
            res.status(500).json({
                error_code: 'SERVER_ERROR',
                message: '建立廣告失敗'
            });
            return;
        }
        // 回傳成功結果
        res.status(201).json({ advertisement_id });
        return;
    }
    catch (error) {
        console.error('建立廣告時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 取得廣告資訊 API
router.get('/advertisements/:advertisement_id', auth_1.authenticateApiKey, async (req, res) => {
    const { advertisement_id } = req.params;
    try {
        // 查詢廣告資訊
        const advertisementResult = await db_1.neo4jClient.runQuery('MATCH (a:Advertisement {advertisement_id: $advertisement_id}) RETURN a', { advertisement_id });
        if (advertisementResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的廣告'
            });
            return;
        }
        // 轉換為響應格式
        const advertisement = advertisementResult.records[0].get('a').properties;
        const advertisementResponse = {
            advertisement_id: advertisement.advertisement_id,
            business_id: advertisement.business_id,
            advertisement_name: advertisement.advertisement_name,
            advertisement_description: advertisement.advertisement_description,
            advertisement_image_url: advertisement.advertisement_image_url,
            advertisement_landing_page_url: advertisement.advertisement_landing_page_url,
            advertisement_start_date: advertisement.advertisement_start_date.toString(),
            advertisement_end_date: advertisement.advertisement_end_date.toString(),
            advertisement_budget: advertisement.advertisement_budget,
            advertisement_target_audience: advertisement.advertisement_target_audience,
            advertisement_status: advertisement.advertisement_status
        };
        res.status(200).json(advertisementResponse);
        return;
    }
    catch (error) {
        console.error('取得廣告資訊時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 更新廣告資訊 API
router.put('/advertisements/:advertisement_id', auth_1.authenticateApiKey, async (req, res) => {
    const { advertisement_id } = req.params;
    const updateData = req.body;
    // 驗證廣告是否存在
    try {
        const advertisementResult = await db_1.neo4jClient.runQuery('MATCH (a:Advertisement {advertisement_id: $advertisement_id}) RETURN a', { advertisement_id });
        if (advertisementResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的廣告'
            });
            return;
        }
        // 檢查廣告狀態
        const advertisement = advertisementResult.records[0].get('a').properties;
        if (advertisement.advertisement_status === 'active' || advertisement.advertisement_status === 'completed') {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '無法更新已啟動或已完成的廣告'
            });
            return;
        }
        // 驗證開始日期和結束日期
        let startDate = advertisement.advertisement_start_date;
        let endDate = advertisement.advertisement_end_date;
        if (updateData.advertisement_start_date) {
            startDate = new Date(updateData.advertisement_start_date);
        }
        if (updateData.advertisement_end_date) {
            endDate = new Date(updateData.advertisement_end_date);
        }
        if (endDate <= startDate) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '廣告結束日期必須晚於開始日期'
            });
            return;
        }
        // 驗證JSON格式的目標受眾
        if (updateData.advertisement_target_audience) {
            try {
                JSON.parse(updateData.advertisement_target_audience);
            }
            catch (e) {
                res.status(400).json({
                    error_code: 'BAD_REQUEST',
                    message: '目標受眾必須是有效的JSON格式'
                });
                return;
            }
        }
        // 構建更新查詢
        let updateQuery = 'MATCH (a:Advertisement {advertisement_id: $advertisement_id}) ';
        let setClause = 'SET a.updated_at = datetime() ';
        const params = { advertisement_id };
        // 動態添加更新欄位
        if (updateData.advertisement_name) {
            setClause += ', a.advertisement_name = $advertisement_name';
            params.advertisement_name = updateData.advertisement_name;
        }
        if (updateData.advertisement_description) {
            setClause += ', a.advertisement_description = $advertisement_description';
            params.advertisement_description = updateData.advertisement_description;
        }
        if (updateData.advertisement_image_url) {
            setClause += ', a.advertisement_image_url = $advertisement_image_url';
            params.advertisement_image_url = updateData.advertisement_image_url;
        }
        if (updateData.advertisement_landing_page_url) {
            setClause += ', a.advertisement_landing_page_url = $advertisement_landing_page_url';
            params.advertisement_landing_page_url = updateData.advertisement_landing_page_url;
        }
        if (updateData.advertisement_start_date) {
            setClause += ', a.advertisement_start_date = date($advertisement_start_date)';
            params.advertisement_start_date = updateData.advertisement_start_date;
        }
        if (updateData.advertisement_end_date) {
            setClause += ', a.advertisement_end_date = date($advertisement_end_date)';
            params.advertisement_end_date = updateData.advertisement_end_date;
        }
        if (updateData.advertisement_budget !== undefined) {
            setClause += ', a.advertisement_budget = $advertisement_budget';
            params.advertisement_budget = updateData.advertisement_budget;
        }
        if (updateData.advertisement_target_audience) {
            setClause += ', a.advertisement_target_audience = $advertisement_target_audience';
            params.advertisement_target_audience = updateData.advertisement_target_audience;
        }
        // 執行更新
        updateQuery += setClause + ' RETURN a';
        await db_1.neo4jClient.runQuery(updateQuery, params);
        res.status(204).send();
        return;
    }
    catch (error) {
        console.error('更新廣告資訊時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 刪除廣告 API
router.delete('/advertisements/:advertisement_id', auth_1.authenticateApiKey, async (req, res) => {
    const { advertisement_id } = req.params;
    try {
        // 查詢廣告是否存在
        const advertisementResult = await db_1.neo4jClient.runQuery('MATCH (a:Advertisement {advertisement_id: $advertisement_id}) RETURN a', { advertisement_id });
        if (advertisementResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的廣告'
            });
            return;
        }
        // 檢查廣告狀態
        const advertisement = advertisementResult.records[0].get('a').properties;
        if (advertisement.advertisement_status === 'active') {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '無法刪除已啟動的廣告'
            });
            return;
        }
        // 刪除廣告與關聯關係
        await db_1.neo4jClient.runQuery(`MATCH (a:Advertisement {advertisement_id: $advertisement_id})
       OPTIONAL MATCH (a)-[r]-()
       DELETE r, a`, { advertisement_id });
        res.status(204).send();
        return;
    }
    catch (error) {
        console.error('刪除廣告時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 查詢廣告列表 API
router.get('/advertisements', auth_1.authenticateApiKey, async (req, res) => {
    const { business_id, is_active, limit = '10', offset = '0' } = req.query;
    if (!business_id) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '缺少必要參數: business_id'
        });
        return;
    }
    try {
        // 構建查詢
        let query = `MATCH (a:Advertisement {business_id: $business_id})`;
        const params = {
            business_id,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10)
        };
        // 如果指定了是否啟用
        if (is_active !== undefined) {
            const isActiveValue = is_active === 'true';
            const today = new Date().toISOString().split('T')[0]; // 今天的日期 (YYYY-MM-DD)
            if (isActiveValue) {
                // 查詢有效廣告 (廣告開始日期 <= 今天 <= 廣告結束日期 且狀態為 'approved')
                query += ` WHERE a.advertisement_start_date <= date($today) AND a.advertisement_end_date >= date($today) AND a.advertisement_status = 'approved'`;
            }
            else {
                // 查詢無效廣告
                query += ` WHERE NOT (a.advertisement_start_date <= date($today) AND a.advertisement_end_date >= date($today) AND a.advertisement_status = 'approved')`;
            }
            params.today = today;
        }
        // 總數查詢
        const countQuery = query + ` RETURN count(a) as total`;
        const countResult = await db_1.neo4jClient.runQuery(countQuery, params);
        const total = (0, neo4jUtils_1.toJsNumber)(countResult.records[0].get('total'));
        // 分頁查詢
        query += ` RETURN a ORDER BY a.created_at DESC SKIP $offset LIMIT $limit`;
        const result = await db_1.neo4jClient.runQuery(query, params);
        // 轉換為響應格式
        const advertisements = result.records.map(record => {
            const a = record.get('a').properties;
            return {
                advertisement_id: a.advertisement_id,
                business_id: a.business_id,
                advertisement_name: a.advertisement_name,
                advertisement_description: a.advertisement_description,
                advertisement_image_url: a.advertisement_image_url,
                advertisement_landing_page_url: a.advertisement_landing_page_url,
                advertisement_start_date: a.advertisement_start_date.toString(),
                advertisement_end_date: a.advertisement_end_date.toString(),
                advertisement_budget: a.advertisement_budget,
                advertisement_target_audience: a.advertisement_target_audience,
                advertisement_status: a.advertisement_status
            };
        });
        const response = {
            total,
            advertisements
        };
        res.status(200).json(response);
        return;
    }
    catch (error) {
        console.error('查詢廣告列表時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 審核廣告 API
router.post('/advertisements/:advertisement_id/approval', auth_1.authenticateApiKey, async (req, res) => {
    const { advertisement_id } = req.params;
    const approvalData = req.body;
    // 驗證請求數據
    if (!validateApproveAdvertisement(approvalData)) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '無效的請求參數',
            details: validateApproveAdvertisement.errors || []
        });
        return;
    }
    try {
        // 查詢廣告是否存在
        const advertisementResult = await db_1.neo4jClient.runQuery('MATCH (a:Advertisement {advertisement_id: $advertisement_id}) RETURN a', { advertisement_id });
        if (advertisementResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的廣告'
            });
            return;
        }
        // 構建更新查詢
        let updateQuery = 'MATCH (a:Advertisement {advertisement_id: $advertisement_id}) ';
        let setClause = 'SET a.updated_at = datetime() ';
        const params = { advertisement_id };
        // 依據審核結果設置狀態
        if (approvalData.approved) {
            setClause += ', a.advertisement_status = "approved"';
        }
        else {
            setClause += ', a.advertisement_status = "rejected"';
            if (approvalData.reason) {
                setClause += ', a.rejection_reason = $rejection_reason';
                params.rejection_reason = approvalData.reason;
            }
        }
        // 執行更新
        updateQuery += setClause + ' RETURN a';
        await db_1.neo4jClient.runQuery(updateQuery, params);
        res.status(204).send();
        return;
    }
    catch (error) {
        console.error('審核廣告時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
exports.default = router;
