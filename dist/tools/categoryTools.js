"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryTools = exports.createCategory = exports.createCategoryImpl = void 0;
/**
 * 類別管理工具
 * 提供商品和服務類別的創建和管理功能
 */
const uuid_1 = require("uuid");
const db_1 = require("../db");
const toolRegistration_1 = require("../utils/toolRegistration");
const tool_1 = require("../types/tool");
// 輸入模式定義
const createCategorySchema = {
    type: 'object',
    properties: {
        business_id: { type: 'string', description: '商家 ID' },
        category_name: { type: 'string', description: '類別名稱' },
        category_description: { type: 'string', description: '類別描述' }
    },
    required: ['business_id', 'category_name']
};
/**
 * 創建類別
 * @param params 類別資訊
 * @returns 新建類別的 ID
 */
const createCategoryImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, createCategorySchema);
    const { business_id, category_name, category_description = '' } = params;
    const bookable_item_category_id = (0, uuid_1.v4)();
    // 使用事務確保操作的原子性
    await db_1.neo4jClient.runInTransaction(async (tx) => {
        // 創建類別節點
        await tx.run(`CREATE (c:Category {
        bookable_item_category_id: $bookable_item_category_id,
        business_id: $business_id,
        category_name: $category_name,
        category_description: $category_description,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN c`, {
            bookable_item_category_id,
            business_id,
            category_name,
            category_description
        });
        // 建立類別與商家的關係
        await tx.run(`MATCH (b:Business {business_id: $business_id})
       MATCH (c:Category {bookable_item_category_id: $bookable_item_category_id})
       CREATE (c)-[:BELONGS_TO]->(b)`, { business_id, bookable_item_category_id });
    });
    return { bookable_item_category_id };
};
exports.createCategoryImpl = createCategoryImpl;
// 建立標準化工具定義
exports.createCategory = (0, toolRegistration_1.createToolDefinition)('createCategory', '創建新的商品或服務類別', createCategorySchema, exports.createCategoryImpl);
// 類別相關工具匯出
exports.categoryTools = {
    createCategory: exports.createCategory
};
