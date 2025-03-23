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
// 创建通知 Schema
const createNotificationSchema = {
    type: 'object',
    properties: {
        notification_type: { type: 'string', enum: ['email', 'sms', 'line'] },
        notification_content: { type: 'string', maxLength: 1000 },
        recipient_user_ids: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            minItems: 1
        },
        booking_id: { type: 'string', format: 'uuid' }
    },
    required: ['notification_type', 'notification_content', 'recipient_user_ids'],
    additionalProperties: false
};
// 验证函数
const validateCreateNotification = ajv_1.default.compile(createNotificationSchema);
// 创建通知 API
router.post('/notifications', auth_1.authenticateApiKey, async (req, res) => {
    const notificationData = req.body;
    // 验证请求数据
    if (!validateCreateNotification(notificationData)) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '无效的请求参数',
            details: validateCreateNotification.errors
        });
        return;
    }
    try {
        // 验证接收者用户ID是否存在
        for (const userId of notificationData.recipient_user_ids) {
            const userResult = await db_1.neo4jClient.runQuery('MATCH (u:User {user_id: $user_id}) RETURN u', { user_id: userId });
            if (userResult.records.length === 0) {
                res.status(400).json({
                    error_code: 'BAD_REQUEST',
                    message: `接收者ID ${userId} 不存在`
                });
                return;
            }
        }
        // 如果提供了booking_id，验证预约是否存在
        if (notificationData.booking_id) {
            const bookingResult = await db_1.neo4jClient.runQuery('MATCH (b:Booking {booking_id: $booking_id}) RETURN b', { booking_id: notificationData.booking_id });
            if (bookingResult.records.length === 0) {
                res.status(400).json({
                    error_code: 'BAD_REQUEST',
                    message: '指定的预约不存在'
                });
                return;
            }
        }
        // 创建新的通知记录
        const notification_id = (0, uuid_1.v4)();
        // 创建通知节点
        const createResult = await db_1.neo4jClient.runQuery(`CREATE (n:Notification {
        notification_id: $notification_id,
        notification_type: $notification_type,
        notification_content: $notification_content,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN n`, {
            notification_id,
            notification_type: notificationData.notification_type,
            notification_content: notificationData.notification_content
        });
        if (createResult.records.length === 0) {
            res.status(500).json({
                error_code: 'SERVER_ERROR',
                message: '创建通知失败'
            });
            return;
        }
        // 如果有关联的预约，创建关系
        if (notificationData.booking_id) {
            await db_1.neo4jClient.runQuery(`MATCH (n:Notification {notification_id: $notification_id})
         MATCH (b:Booking {booking_id: $booking_id})
         CREATE (b)-[:HAS_NOTIFICATION]->(n)`, {
                notification_id,
                booking_id: notificationData.booking_id
            });
        }
        // 为每个接收者创建关系
        for (const userId of notificationData.recipient_user_ids) {
            await db_1.neo4jClient.runQuery(`MATCH (n:Notification {notification_id: $notification_id})
         MATCH (u:User {user_id: $user_id})
         CREATE (u)-[:RECEIVED_NOTIFICATION]->(n)`, {
                notification_id,
                user_id: userId
            });
        }
        // 返回成功结果
        res.status(201).json({ notification_id });
        return;
    }
    catch (error) {
        console.error('创建通知时发生错误:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '服务器发生错误'
        });
        return;
    }
});
// 获取用户通知列表 API
router.get('/users/:user_id/notifications', auth_1.authenticateApiKey, async (req, res) => {
    const { user_id } = req.params;
    const { limit = '10', offset = '0' } = req.query;
    try {
        // 验证用户是否存在
        const userResult = await db_1.neo4jClient.runQuery('MATCH (u:User {user_id: $user_id}) RETURN u', { user_id });
        if (userResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的用户'
            });
            return;
        }
        // 获取总数
        const countQuery = `
      MATCH (u:User {user_id: $user_id})-[:RECEIVED_NOTIFICATION]->(n:Notification)
      RETURN count(n) as total`;
        const countResult = await db_1.neo4jClient.runQuery(countQuery, { user_id });
        const total = (0, neo4jUtils_1.toJsNumber)(countResult.records[0].get('total'));
        // 获取通知列表
        const query = `
      MATCH (u:User {user_id: $user_id})-[:RECEIVED_NOTIFICATION]->(n:Notification)
      OPTIONAL MATCH (b:Booking)-[:HAS_NOTIFICATION]->(n)
      RETURN n, b.booking_id as booking_id
      ORDER BY n.created_at DESC
      SKIP $offset LIMIT $limit`;
        const result = await db_1.neo4jClient.runQuery(query, {
            user_id,
            offset: parseInt(offset, 10),
            limit: parseInt(limit, 10)
        });
        // 转换为响应格式
        const notifications = result.records.map(record => {
            const n = record.get('n').properties;
            const booking_id = record.get('booking_id');
            return {
                notification_id: n.notification_id,
                notification_type: n.notification_type,
                notification_content: n.notification_content,
                created_at: n.created_at.toString(),
                updated_at: n.updated_at.toString(),
                booking_id: booking_id || undefined
            };
        });
        const response = {
            total,
            notifications
        };
        res.status(200).json(response);
        return;
    }
    catch (error) {
        console.error('获取用户通知列表时发生错误:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '服务器发生错误'
        });
        return;
    }
});
// 获取预约的通知列表 API
router.get('/bookings/:booking_id/notifications', auth_1.authenticateApiKey, async (req, res) => {
    const { booking_id } = req.params;
    try {
        // 验证预约是否存在
        const bookingResult = await db_1.neo4jClient.runQuery('MATCH (b:Booking {booking_id: $booking_id}) RETURN b', { booking_id });
        if (bookingResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的预约'
            });
            return;
        }
        // 获取通知列表
        const query = `
      MATCH (b:Booking {booking_id: $booking_id})-[:HAS_NOTIFICATION]->(n:Notification)
      RETURN n
      ORDER BY n.created_at DESC`;
        const result = await db_1.neo4jClient.runQuery(query, { booking_id });
        // 转换为响应格式
        const notifications = result.records.map(record => {
            const n = record.get('n').properties;
            return {
                notification_id: n.notification_id,
                notification_type: n.notification_type,
                notification_content: n.notification_content,
                created_at: n.created_at.toString(),
                updated_at: n.updated_at.toString(),
                booking_id: booking_id
            };
        });
        const response = {
            total: notifications.length,
            notifications
        };
        res.status(200).json(response);
        return;
    }
    catch (error) {
        console.error('获取预约通知列表时发生错误:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '服务器发生错误'
        });
        return;
    }
});
// 删除通知 API
router.delete('/notifications/:notification_id', auth_1.authenticateApiKey, async (req, res) => {
    const { notification_id } = req.params;
    try {
        // 验证通知是否存在
        const notificationResult = await db_1.neo4jClient.runQuery('MATCH (n:Notification {notification_id: $notification_id}) RETURN n', { notification_id });
        if (notificationResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的通知'
            });
            return;
        }
        // 删除通知及其关系
        await db_1.neo4jClient.runQuery(`MATCH (n:Notification {notification_id: $notification_id})
       OPTIONAL MATCH (n)-[r]-()
       DELETE r, n`, { notification_id });
        res.status(204).send();
        return;
    }
    catch (error) {
        console.error('删除通知时发生错误:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '服务器发生错误'
        });
        return;
    }
});
exports.default = router;
