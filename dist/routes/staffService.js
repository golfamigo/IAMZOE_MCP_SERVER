"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ajv_1 = __importDefault(require("../utils/ajv")); // Use centralized AJV
const db_1 = require("../db");
const neo4jUtils_1 = require("../utils/neo4jUtils");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// 员工服务关系 Schema
const staffServiceSchema = {
    type: 'object',
    properties: {
        bookable_item_id: { type: 'string', format: 'uuid' }
    },
    required: ['bookable_item_id'],
    additionalProperties: false
};
// 验证函数
const validateStaffService = ajv_1.default.compile(staffServiceSchema);
// 添加员工提供的服务 API
router.post('/staff/:staff_member_id/services', auth_1.authenticateApiKey, async (req, res) => {
    const { staff_member_id } = req.params;
    const serviceData = req.body;
    // 验证请求数据
    if (!validateStaffService(serviceData)) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '无效的请求参数',
            details: validateStaffService.errors
        });
        return;
    }
    try {
        // 检查员工是否存在
        const staffResult = await db_1.neo4jClient.runQuery('MATCH (s:Staff {staff_member_id: $staff_member_id}) RETURN s', { staff_member_id });
        if (staffResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的员工'
            });
            return;
        }
        // 检查服务是否存在
        const serviceResult = await db_1.neo4jClient.runQuery('MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id}) RETURN bi', { bookable_item_id: serviceData.bookable_item_id });
        if (serviceResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的服务'
            });
            return;
        }
        // 检查关系是否已存在
        const relationshipResult = await db_1.neo4jClient.runQuery(`MATCH (s:Staff {staff_member_id: $staff_member_id})-[r:CAN_PROVIDE]->(bi:BookableItem {bookable_item_id: $bookable_item_id})
       RETURN r`, {
            staff_member_id,
            bookable_item_id: serviceData.bookable_item_id
        });
        if (relationshipResult.records.length > 0) {
            res.status(400).json({
                error_code: 'BAD_REQUEST',
                message: '该员工已经能提供此服务'
            });
            return;
        }
        // 创建员工与服务之间的关系
        await db_1.neo4jClient.runQuery(`MATCH (s:Staff {staff_member_id: $staff_member_id}), (bi:BookableItem {bookable_item_id: $bookable_item_id})
       CREATE (s)-[r:CAN_PROVIDE {created_at: datetime()}]->(bi)
       RETURN r`, {
            staff_member_id,
            bookable_item_id: serviceData.bookable_item_id
        });
        res.status(204).send();
        return;
    }
    catch (error) {
        console.error('添加员工提供的服务时发生错误:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '服务器发生错误'
        });
        return;
    }
});
// 获取员工提供的服务列表 API
router.get('/staff/:staff_member_id/services', auth_1.authenticateApiKey, async (req, res) => {
    const { staff_member_id } = req.params;
    try {
        // 检查员工是否存在
        const staffResult = await db_1.neo4jClient.runQuery('MATCH (s:Staff {staff_member_id: $staff_member_id}) RETURN s', { staff_member_id });
        if (staffResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的员工'
            });
            return;
        }
        // 获取员工提供的服务列表
        const countQuery = `
      MATCH (s:Staff {staff_member_id: $staff_member_id})-[:CAN_PROVIDE]->(bi:BookableItem)
      RETURN count(bi) as total`;
        const countResult = await db_1.neo4jClient.runQuery(countQuery, { staff_member_id });
        const total = (0, neo4jUtils_1.toJsNumber)(countResult.records[0].get('total'));
        const query = `
      MATCH (s:Staff {staff_member_id: $staff_member_id})-[:CAN_PROVIDE]->(bi:BookableItem)
      RETURN bi
      ORDER BY bi.bookable_item_name`;
        const result = await db_1.neo4jClient.runQuery(query, { staff_member_id });
        // 转换为响应格式
        const services = result.records.map(record => {
            const bi = record.get('bi').properties;
            return {
                staff_member_id,
                bookable_item_id: bi.bookable_item_id,
                bookable_item_name: bi.bookable_item_name,
                bookable_item_type_code: bi.bookable_item_type_code,
                bookable_item_duration: bi.bookable_item_duration
            };
        });
        const response = {
            total,
            services
        };
        res.status(200).json(response);
        return;
    }
    catch (error) {
        console.error('获取员工提供的服务列表时发生错误:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '服务器发生错误'
        });
        return;
    }
});
// 删除员工提供的服务 API
router.delete('/staff/:staff_member_id/services/:bookable_item_id', auth_1.authenticateApiKey, async (req, res) => {
    const { staff_member_id, bookable_item_id } = req.params;
    try {
        // 检查关系是否存在
        const relationshipResult = await db_1.neo4jClient.runQuery(`MATCH (s:Staff {staff_member_id: $staff_member_id})-[r:CAN_PROVIDE]->(bi:BookableItem {bookable_item_id: $bookable_item_id})
       RETURN r`, { staff_member_id, bookable_item_id });
        if (relationshipResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的关系'
            });
            return;
        }
        // 删除关系
        await db_1.neo4jClient.runQuery(`MATCH (s:Staff {staff_member_id: $staff_member_id})-[r:CAN_PROVIDE]->(bi:BookableItem {bookable_item_id: $bookable_item_id})
       DELETE r`, { staff_member_id, bookable_item_id });
        res.status(204).send();
        return;
    }
    catch (error) {
        console.error('删除员工提供的服务时发生错误:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '服务器发生错误'
        });
        return;
    }
});
// 查找能提供指定服务的员工 API
router.get('/services/:bookable_item_id/staff', auth_1.authenticateApiKey, async (req, res) => {
    const { bookable_item_id } = req.params;
    const { business_id } = req.query;
    if (!business_id) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '缺少必要参数: business_id'
        });
        return;
    }
    try {
        // 检查服务是否存在
        const serviceResult = await db_1.neo4jClient.runQuery('MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id}) RETURN bi', { bookable_item_id });
        if (serviceResult.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的服务'
            });
            return;
        }
        // 获取能提供该服务的员工列表
        const query = `
      MATCH (s:Staff {business_id: $business_id, staff_member_is_active: true})-[:CAN_PROVIDE]->(bi:BookableItem {bookable_item_id: $bookable_item_id})
      RETURN s
      ORDER BY s.staff_member_name`;
        const result = await db_1.neo4jClient.runQuery(query, {
            business_id: business_id,
            bookable_item_id
        });
        // 转换为响应格式
        const staff = result.records.map(record => {
            const s = record.get('s').properties;
            return {
                staff_member_id: s.staff_member_id,
                staff_member_name: s.staff_member_name,
                staff_member_email: s.staff_member_email,
                staff_member_phone: s.staff_member_phone
            };
        });
        res.status(200).json({
            total: staff.length,
            staff
        });
        return;
    }
    catch (error) {
        console.error('查找能提供指定服务的员工时发生错误:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '服务器发生错误'
        });
        return;
    }
});
exports.default = router;
