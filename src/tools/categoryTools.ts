/**
 * 類別管理工具
 * 提供商品和服務類別的創建和管理功能
 */
import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';
import { createToolDefinition } from '../utils/toolRegistration';
import { validateParams } from '../types/tool';

// 接口定義
export interface Category {
  bookable_item_category_id: string;
  business_id: string;
  category_name: string;
  category_description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryParams {
  business_id: string;
  category_name: string;
  category_description?: string;
}

export interface CreateCategoryResult {
  bookable_item_category_id: string;
}

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
export const createCategoryImpl = async (params: CreateCategoryParams): Promise<CreateCategoryResult> => {
  // 驗證輸入參數
  validateParams(params, createCategorySchema);
  
  const { business_id, category_name, category_description = '' } = params;
  
  const bookable_item_category_id = uuidv4();
  
  // 使用事務確保操作的原子性
  await neo4jClient.runInTransaction(async (tx) => {
    // 創建類別節點
    await tx.run(
      `CREATE (c:Category {
        bookable_item_category_id: $bookable_item_category_id,
        business_id: $business_id,
        category_name: $category_name,
        category_description: $category_description,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN c`,
      { 
        bookable_item_category_id, 
        business_id, 
        category_name, 
        category_description
      }
    );
    
    // 建立類別與商家的關係
    await tx.run(
      `MATCH (b:Business {business_id: $business_id})
       MATCH (c:Category {bookable_item_category_id: $bookable_item_category_id})
       CREATE (c)-[:BELONGS_TO]->(b)`,
      { business_id, bookable_item_category_id }
    );
  });
  
  return { bookable_item_category_id };
};

// 建立標準化工具定義
export const createCategory = createToolDefinition(
  'createCategory',
  '創建新的商品或服務類別',
  createCategorySchema,
  createCategoryImpl
);

// 類別相關工具匯出
export const categoryTools = {
  createCategory
};
