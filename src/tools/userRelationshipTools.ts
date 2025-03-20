/**
 * 使用者關係管理工具
 * 提供使用者之間關係的創建和查詢功能
 */
import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';
import { createToolDefinition } from '../utils/toolRegistration';
import { validateParams } from '../types/tool';
import { throwIfNotFound, throwInvalidParam, throwBusinessLogicError } from '../utils/errorHandling';

// 接口定義
export interface UserRelationship {
  user_relationship_id: string;
  user_id_1: string;
  user_id_2: string;
  relationship_type: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRelationshipParams {
  user_id_1: string;
  user_id_2: string;
  relationship_type: string;
}

export interface CreateUserRelationshipResult {
  user_relationship_id: string;
}

export interface GetUserRelationshipParams {
  user_id_1: string;
  user_id_2: string;
}

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
export const createUserRelationshipImpl = async (params: CreateUserRelationshipParams): Promise<CreateUserRelationshipResult> => {
  // 驗證輸入參數
  validateParams(params, createUserRelationshipSchema);
  
  const { user_id_1, user_id_2, relationship_type } = params;
  
  // 驗證使用者是否存在
  const usersResult = await neo4jClient.runQuery(
    `MATCH (u1:User {user_id: $user_id_1})
     MATCH (u2:User {user_id: $user_id_2})
     RETURN u1, u2`,
    { user_id_1, user_id_2 }
  );
  
  if (usersResult.records.length === 0) {
    throwBusinessLogicError('找不到指定的使用者');
  }
  
  // 檢查是否已存在關係
  const existingResult = await neo4jClient.runQuery(
    `MATCH (ur:UserRelationship)
     WHERE (ur.user_id_1 = $user_id_1 AND ur.user_id_2 = $user_id_2)
        OR (ur.user_id_1 = $user_id_2 AND ur.user_id_2 = $user_id_1)
     RETURN ur`,
    { user_id_1, user_id_2 }
  );
  
  if (existingResult.records.length > 0) {
    throwBusinessLogicError('這兩個使用者之間已存在關係');
  }
  
  // 驗證關係類型
  const validRelationshipTypes = ['friend', 'family', 'colleague', 'partner', 'other'];
  if (!validRelationshipTypes.includes(relationship_type) && !relationship_type.startsWith('custom_')) {
    throwInvalidParam(`關係類型必須是以下值之一: ${validRelationshipTypes.join(', ')}，或以 'custom_' 開頭的自定義類型`);
  }
  
  const user_relationship_id = uuidv4();
  
  await neo4jClient.runQuery(
    `CREATE (ur:UserRelationship {
      user_relationship_id: $user_relationship_id,
      user_id_1: $user_id_1,
      user_id_2: $user_id_2,
      relationship_type: $relationship_type,
      created_at: datetime(),
      updated_at: datetime()
    }) RETURN ur`,
    { 
      user_relationship_id, 
      user_id_1, 
      user_id_2, 
      relationship_type
    }
  );
  
  // 建立使用者與關係的連結
  await neo4jClient.runQuery(
    `MATCH (u1:User {user_id: $user_id_1})
     MATCH (u2:User {user_id: $user_id_2})
     MATCH (ur:UserRelationship {user_relationship_id: $user_relationship_id})
     CREATE (u1)-[:HAS_RELATIONSHIP]->(ur)
     CREATE (u2)-[:HAS_RELATIONSHIP]->(ur)`,
    { user_id_1, user_id_2, user_relationship_id }
  );
  
  return { user_relationship_id };
};

/**
 * 獲取使用者關係
 * @param params 查詢參數
 * @returns 使用者關係資訊，如果不存在則返回 null
 */
export const getUserRelationshipImpl = async (params: GetUserRelationshipParams): Promise<UserRelationship | null> => {
  // 驗證輸入參數
  validateParams(params, getUserRelationshipSchema);
  
  const { user_id_1, user_id_2 } = params;
  
  const result = await neo4jClient.runQuery(
    `MATCH (ur:UserRelationship)
     WHERE (ur.user_id_1 = $user_id_1 AND ur.user_id_2 = $user_id_2)
        OR (ur.user_id_1 = $user_id_2 AND ur.user_id_2 = $user_id_1)
     RETURN ur`,
    { user_id_1, user_id_2 }
  );
  
  if (result.records.length === 0) {
    return null;
  }
  
  return result.records[0].get('ur').properties;
};

// 建立標準化工具定義
export const createUserRelationship = createToolDefinition(
  'createUserRelationship',
  '創建使用者之間的關係',
  createUserRelationshipSchema,
  createUserRelationshipImpl
);

export const getUserRelationship = createToolDefinition(
  'getUserRelationship',
  '獲取兩個使用者之間的關係',
  getUserRelationshipSchema,
  getUserRelationshipImpl
);

// 使用者關係相關工具匯出
export const userRelationshipTools = {
  createUserRelationship,
  getUserRelationship
};
