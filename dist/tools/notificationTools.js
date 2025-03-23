"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationTools = exports.createNotification = exports.createNotificationImpl = void 0;
/**
 * 通知管理工具
 * 提供系統通知的創建和管理功能
 */
const uuid_1 = require("uuid");
const db_1 = require("../db");
const toolRegistration_1 = require("../utils/toolRegistration");
const tool_1 = require("../types/tool");
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
        },
        business_id: {
            type: 'string',
            description: '商家 ID（可選）'
        }
    },
    required: ['notification_type', 'notification_content']
};
/**
 * 創建通知
 * @param params 通知資訊
 * @returns 新建通知的 ID
 */
const createNotificationImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, createNotificationSchema);
    const { notification_type, notification_content, business_id } = params;
    const notification_id = (0, uuid_1.v4)();
    await db_1.neo4jClient.runQuery(`CREATE (n:Notification {
      notification_id: $notification_id,
      notification_type: $notification_type,
      notification_content: $notification_content,
      business_id: $business_id,
      created_at: datetime(),
      updated_at: datetime()
    }) RETURN n`, {
        notification_id,
        notification_type,
        notification_content,
        business_id: business_id || null
    });
    // 如果提供了商家ID，建立通知與商家的關係
    if (business_id) {
        await db_1.neo4jClient.runQuery(`MATCH (n:Notification {notification_id: $notification_id})
       MATCH (b:Business {business_id: $business_id})
       CREATE (n)-[:BELONGS_TO]->(b)`, { notification_id, business_id });
    }
    return { notification_id };
};
exports.createNotificationImpl = createNotificationImpl;
// 建立標準化工具定義
exports.createNotification = (0, toolRegistration_1.createToolDefinition)('createNotification', '創建新的系統通知', createNotificationSchema, exports.createNotificationImpl);
// 通知相關工具匯出
exports.notificationTools = {
    createNotification: exports.createNotification
};
