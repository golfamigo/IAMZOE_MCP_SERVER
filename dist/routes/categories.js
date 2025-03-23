"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const ajv_1 = __importDefault(require("../utils/ajv"));
const db_1 = require("../db");
const neo4jUtils_1 = require("../utils/neo4jUtils");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// 建立類別 Schema
const createCategorySchema = {
    type: 'object',
    properties: {
        business_id: { type: 'string', format: 'uuid' },
        category_name: { type: 'string', maxLength: 255 },
        category_description: { type: 'string', maxLength: 1000 }
    },
    required: ['business_id', 'category_name'],
    additionalProperties: false
};
// 驗證函式
const validateCreateCategory = ajv_1.default.compile(createCategorySchema);
// 建立類別 API
router.post('/categories', auth_1.authenticateApiKey, async (req, res) => {
    const categoryData = req.body;
    // 驗證請求數據
    if (!validateCreateCategory(categoryData)) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '無效的請求參數',
            details: validateCreateCategory.errors || []
        });
        return;
    }
    try {
        // 檢查 business_id 是否存在
        const businessResult = await db_1.neo4jClient.runQuery('MATCH (b:Business {business_id: $business_id}) RETURN b', { business_id: categoryData.business_id });
        if (businessResult.records.length === 0) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '指定的商家不存在'
            });
            return;
        }
        // 檢查是否已存在相同名稱的類別
        const categoryResult = await db_1.neo4jClient.runQuery('MATCH (c:Category {business_id: $business_id, category_name: $category_name}) RETURN c', {
            business_id: categoryData.business_id,
            category_name: categoryData.category_name
        });
        if (categoryResult.records.length > 0) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '該商家已存在相同名稱的類別'
            });
            return;
        }
        // 創建新的類別
        const bookable_item_category_id = (0, uuid_1.v4)();
        const createResult = await db_1.neo4jClient.runQuery(`CREATE (c:Category {
        bookable_item_category_id: $bookable_item_category_id,
        business_id: $business_id,
        category_name: $category_name,
        category_description: $category_description,
        created_at: datetime(),
        updated_at: datetime()
      })
      WITH c
      MATCH (b:Business {business_id: $business_id})
      CREATE (c)-[:BELONGS_TO]->(b)
      RETURN c`, {
            bookable_item_category_id,
            business_id: categoryData.business_id,
            category_name: categoryData.category_name,
            category_description: categoryData.category_description || null
        });
        if (createResult.records.length === 0) {
            res.status(500).json({
                error_code: 'SERVER_ERROR',
                message: '建立類別失敗'
            });
            return;
        }
        // 回傳成功結果
        res.status(201).json({ bookable_item_category_id });
        return;
    }
    catch (error) {
        console.error('建立類別時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 取得類別資訊 API
router.get('/categories/:bookable_item_category_id', auth_1.authenticateApiKey, async (req, res) => {
    const { bookable_item_category_id } = req.params;
    try {
        // 查詢類別資訊
        const categoryResult = await db_1.neo4jClient.runQuery('MATCH (c:Category {bookable_item_category_id: $bookable_item_category_id}) RETURN c', { bookable_item_category_id });
        if (categoryResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的類別'
            });
            return;
        }
        // 轉換為響應格式
        const category = categoryResult.records[0].get('c').properties;
        const categoryResponse = {
            bookable_item_category_id: category.bookable_item_category_id,
            business_id: category.business_id,
            category_name: category.category_name,
            category_description: category.category_description
        };
        res.status(200).json(categoryResponse);
        return;
    }
    catch (error) {
        console.error('取得類別資訊時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 更新類別資訊 API
router.put('/categories/:bookable_item_category_id', auth_1.authenticateApiKey, async (req, res) => {
    const { bookable_item_category_id } = req.params;
    const updateData = req.body;
    // 驗證類別是否存在
    try {
        const categoryResult = await db_1.neo4jClient.runQuery('MATCH (c:Category {bookable_item_category_id: $bookable_item_category_id}) RETURN c', { bookable_item_category_id });
        if (categoryResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的類別'
            });
            return;
        }
        // 如果要更新名稱，檢查是否與其他類別重名
        if (updateData.category_name) {
            const category = categoryResult.records[0].get('c').properties;
            const duplicateResult = await db_1.neo4jClient.runQuery(`MATCH (c:Category {business_id: $business_id, category_name: $category_name})
         WHERE c.bookable_item_category_id <> $bookable_item_category_id
         RETURN c`, {
                business_id: category.business_id,
                category_name: updateData.category_name,
                bookable_item_category_id
            });
            if (duplicateResult.records.length > 0) {
                res.status(400).json({
                    error_code: 'BAD_REQUEST',
                    message: '該商家已存在相同名稱的類別'
                });
                return;
            }
        }
        // 構建更新查詢
        let updateQuery = 'MATCH (c:Category {bookable_item_category_id: $bookable_item_category_id}) ';
        let setClause = 'SET c.updated_at = datetime() ';
        const params = { bookable_item_category_id };
        // 動態添加更新欄位
        if (updateData.category_name) {
            setClause += ', c.category_name = $category_name';
            params.category_name = updateData.category_name;
        }
        if (updateData.category_description !== undefined) {
            setClause += ', c.category_description = $category_description';
            params.category_description = updateData.category_description;
        }
        // 執行更新
        updateQuery += setClause + ' RETURN c';
        await db_1.neo4jClient.runQuery(updateQuery, params);
        res.status(204).send();
        return;
    }
    catch (error) {
        console.error('更新類別資訊時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 刪除類別 API
router.delete('/categories/:bookable_item_category_id', auth_1.authenticateApiKey, async (req, res) => {
    const { bookable_item_category_id } = req.params;
    try {
        // 查詢類別是否存在
        const categoryResult = await db_1.neo4jClient.runQuery('MATCH (c:Category {bookable_item_category_id: $bookable_item_category_id}) RETURN c', { bookable_item_category_id });
        if (categoryResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的類別'
            });
            return;
        }
        // 檢查是否還有服務屬於該類別
        const serviceResult = await db_1.neo4jClient.runQuery(`MATCH (c:Category {bookable_item_category_id: $bookable_item_category_id})<-[:HAS_CATEGORY]-(bi:BookableItem)
       RETURN bi`, { bookable_item_category_id });
        if (serviceResult.records.length > 0) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '該類別下還有服務，無法刪除'
            });
            return;
        }
        // 刪除類別與關聯關係
        await db_1.neo4jClient.runQuery(`MATCH (c:Category {bookable_item_category_id: $bookable_item_category_id})
       OPTIONAL MATCH (c)-[r]-()
       DELETE r, c`, { bookable_item_category_id });
        res.status(204).send();
        return;
    }
    catch (error) {
        console.error('刪除類別時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
// 查詢類別列表 API
router.get('/categories', auth_1.authenticateApiKey, async (req, res) => {
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
        const query = `MATCH (c:Category {business_id: $business_id}) RETURN c`;
        const params = {
            business_id,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10)
        };
        // 總數查詢
        const countResult = await db_1.neo4jClient.runQuery(query + ` RETURN count(c) as total`, params);
        const total = (0, neo4jUtils_1.toJsNumber)(countResult.records[0].get('total'));
        // 分頁查詢
        const result = await db_1.neo4jClient.runQuery(query + ` ORDER BY c.category_name SKIP $offset LIMIT $limit`, params);
        // 轉換為響應格式
        const categories = result.records.map(record => {
            const c = record.get('c').properties;
            return {
                bookable_item_category_id: c.bookable_item_category_id,
                business_id: c.business_id,
                category_name: c.category_name,
                category_description: c.category_description
            };
        });
        const response = {
            total,
            categories
        };
        res.status(200).json(response);
        return;
    }
    catch (error) {
        console.error('查詢類別列表時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
        return;
    }
});
exports.default = router;
