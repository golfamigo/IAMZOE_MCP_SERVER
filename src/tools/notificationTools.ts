/**
 * 通知管理工具
 * 提供系統通知的創建和管理功能
 */
import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';
import { createToolDefinition } from '../utils/toolRegistration';
import { validateParams } from '../types/tool';

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

// 輸入模式定義
const createNotificationSchema = {
  type: 'object',
  properties: {
    notification_type: { 
      type: 'string', 
      description: '通知類型，例如：system, booking, promotion 等' 
    },
    notification_content: { 
      type: 'string', 
      description: '通知內容' 
    }
  },
  required: ['notification_type', 'notification_content']
};

/**
 * 創建通知
 * @param params 通知資訊
 * @returns 新建通知的 ID
 */
export const createNotificationImpl = async (params: CreateNotificationParams): Promise<CreateNotificationResult> => {
  // 驗證輸入參數
  validateParams(params, createNotificationSchema);
  
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
};

// 建立標準化工具定義
export const createNotification = createToolDefinition(
  'createNotification',
  '創建新的系統通知',
  createNotificationSchema,
  createNotificationImpl
);

// 通知相關工具匯出
export const notificationTools = {
  createNotification
};
