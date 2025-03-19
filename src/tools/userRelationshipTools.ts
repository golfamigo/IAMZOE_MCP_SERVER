import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';

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

// 使用者關係相關工具
export const userRelationshipTools = {
  // 創建使用者關係
  createUserRelationship: async (params: CreateUserRelationshipParams): Promise<CreateUserRelationshipResult> => {
    const { user_id_1, user_id_2, relationship_type } = params;
    
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
    
    return { user_relationship_id };
  },
  
  // 獲取使用者關係
  getUserRelationship: async (params: GetUserRelationshipParams): Promise<UserRelationship | null> => {
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
  }
};
