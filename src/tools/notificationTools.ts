import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';

// 接口定義
export interface Notification {
  notification_id: string;
  notification_type: string;
  notification_content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  notification_type: string;
  notification_content: string;
}

export interface CreateNotificationResult {
  notification_id: string;
}

// 通知相關工具
export const notificationTools = {
  // 創建通知
  createNotification: async (params: CreateNotificationParams): Promise<CreateNotificationResult> => {
    const { notification_type, notification_content } = params;
    
    const notification_id = uuidv4();
    
    await neo4jClient.runQuery(
      `CREATE (n:Notification {
        notification_id: $notification_id,
        notification_type: $notification_type,
        notification_content: $notification_content,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN n`,
      { 
        notification_id, 
        notification_type, 
        notification_content
      }
    );
    
    return { notification_id };
  }
};
