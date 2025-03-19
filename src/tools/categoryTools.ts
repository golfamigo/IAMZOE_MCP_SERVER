import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';

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

// 類別相關工具
export const categoryTools = {
  // 創建類別
  createCategory: async (params: CreateCategoryParams): Promise<CreateCategoryResult> => {
    const { business_id, category_name, category_description = '' } = params;
    
    const bookable_item_category_id = uuidv4();
    
    await neo4jClient.runQuery(
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
    
    return { bookable_item_category_id };
  }
};
