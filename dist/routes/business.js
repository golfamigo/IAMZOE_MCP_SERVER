"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const ajv_1 = __importDefault(require("../utils/ajv"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// 建立商家 Schema
const createBusinessSchema = {
    type: 'object',
    properties: {
        business_name: { type: 'string', maxLength: 255 },
        business_timezone: { type: 'string' },
        business_contact_email: { type: 'string', format: 'email', nullable: true },
        business_contact_phone: { type: 'string', pattern: '^\\+?[1-9]\\d{1,14}$', nullable: true },
        business_address: { type: 'string', maxLength: 255, nullable: true },
        business_location: {
            type: 'object',
            properties: {
                latitude: { type: 'number', minimum: -90, maximum: 90 },
                longitude: { type: 'number', minimum: -180, maximum: 180 }
            },
            required: ['latitude', 'longitude'],
            nullable: true
        },
        line_destination: { type: 'string', nullable: true }
    },
    required: ['business_name', 'business_timezone'],
    additionalProperties: false
};
const updateBusinessSchema = {
    type: 'object',
    properties: {
        business_name: { type: 'string', maxLength: 255, nullable: true },
        business_timezone: { type: 'string', nullable: true },
        business_contact_email: { type: 'string', format: 'email', nullable: true },
        business_contact_phone: { type: 'string', pattern: '^\\+?[1-9]\\d{1,14}$', nullable: true },
        business_address: { type: 'string', maxLength: 255, nullable: true },
        business_location: {
            type: ['object', 'null'],
            properties: {
                latitude: { type: 'number', minimum: -90, maximum: 90 },
                longitude: { type: 'number', minimum: -180, maximum: 180 }
            },
            required: ['latitude', 'longitude']
        },
        line_destination: { type: 'string', nullable: true }
    },
    additionalProperties: false
};
// 驗證函式
const validateCreateBusiness = ajv_1.default.compile(createBusinessSchema);
const validateUpdateBusiness = ajv_1.default.compile(updateBusinessSchema);
// 建立商家 API
router.post('/business', auth_1.authenticateApiKey, async (req, res) => {
    const businessData = req.body;
    if (!validateCreateBusiness(businessData)) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '無效的請求參數',
            details: validateCreateBusiness.errors
        });
        return;
    }
    try {
        const business_id = (0, uuid_1.v4)();
        // 修改查詢語句，避免使用三元運算符
        let locationQuery = 'null';
        if (businessData.business_location) {
            locationQuery = `point({latitude: ${businessData.business_location.latitude}, longitude: ${businessData.business_location.longitude}})`;
        }
        const createResult = await db_1.neo4jClient.runQuery(`CREATE (b:Business {
        business_id: $business_id,
        business_name: $business_name,
        business_timezone: $business_timezone,
        business_contact_email: $business_contact_email,
        business_contact_phone: $business_contact_phone,
        business_address: $business_address,
        business_location: ${locationQuery},
        line_destination: $line_destination,
        created_at: datetime(),
        updated_at: datetime()
      })
      RETURN b`, {
            business_id,
            business_name: businessData.business_name,
            business_timezone: businessData.business_timezone,
            business_contact_email: businessData.business_contact_email || null,
            business_contact_phone: businessData.business_contact_phone || null,
            business_address: businessData.business_address || null,
            line_destination: businessData.line_destination || null
        });
        if (createResult.records.length === 0) {
            res.status(500).json({
                error_code: 'SERVER_ERROR',
                message: '建立商家失敗'
            });
            return;
        }
        res.status(201).json({ business_id });
    }
    catch (error) {
        console.error('建立商家時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
    }
});
// 查詢商家資訊 API
router.get('/business/:business_id', auth_1.authenticateApiKey, async (req, res) => {
    const { business_id } = req.params;
    try {
        const result = await db_1.neo4jClient.runQuery('MATCH (b:Business {business_id: $business_id}) RETURN b', { business_id });
        if (result.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的商家'
            });
            return;
        }
        const business = result.records[0].get('b').properties;
        const businessResponse = {
            business_id: business.business_id,
            business_name: business.business_name,
            business_timezone: business.business_timezone,
            business_contact_email: business.business_contact_email,
            business_contact_phone: business.business_contact_phone,
            business_address: business.business_address,
            business_location: business.business_location
                ? {
                    latitude: business.business_location.latitude,
                    longitude: business.business_location.longitude
                }
                : null,
            line_destination: business.line_destination
        };
        res.status(200).json(businessResponse);
    }
    catch (error) {
        console.error('查詢商家時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
    }
});
// 更新商家資訊 API
router.put('/business/:business_id', auth_1.authenticateApiKey, async (req, res) => {
    const { business_id } = req.params;
    const updateData = req.body;
    if (!validateUpdateBusiness(updateData)) {
        res.status(400).json({
            error_code: 'BAD_REQUEST',
            message: '無效的請求參數',
            details: validateUpdateBusiness.errors
        });
        return;
    }
    try {
        const result = await db_1.neo4jClient.runQuery('MATCH (b:Business {business_id: $business_id}) RETURN b', { business_id });
        if (result.records.length === 0) {
            res.status(404).json({
                error_code: 'NOT_FOUND',
                message: '找不到指定的商家'
            });
            return;
        }
        let updateQuery = 'MATCH (b:Business {business_id: $business_id}) SET b.updated_at = datetime()';
        const params = { business_id };
        if (updateData.business_name !== undefined) {
            updateQuery += ', b.business_name = $business_name';
            params.business_name = updateData.business_name;
        }
        if (updateData.business_timezone !== undefined) {
            updateQuery += ', b.business_timezone = $business_timezone';
            params.business_timezone = updateData.business_timezone;
        }
        if (updateData.business_contact_email !== undefined) {
            updateQuery += ', b.business_contact_email = $business_contact_email';
            params.business_contact_email = updateData.business_contact_email;
        }
        if (updateData.business_contact_phone !== undefined) {
            updateQuery += ', b.business_contact_phone = $business_contact_phone';
            params.business_contact_phone = updateData.business_contact_phone;
        }
        if (updateData.business_address !== undefined) {
            updateQuery += ', b.business_address = $business_address';
            params.business_address = updateData.business_address;
        }
        if (updateData.business_location !== undefined) {
            // 修改更新位置的處理方式
            if (updateData.business_location === null) {
                updateQuery += ', b.business_location = null';
            }
            else {
                updateQuery += `, b.business_location = point({latitude: ${updateData.business_location.latitude}, longitude: ${updateData.business_location.longitude}})`;
            }
        }
        if (updateData.line_destination !== undefined) {
            updateQuery += ', b.line_destination = $line_destination';
            params.line_destination = updateData.line_destination;
        }
        updateQuery += ' RETURN b';
        await db_1.neo4jClient.runQuery(updateQuery, params);
        res.status(204).send();
    }
    catch (error) {
        console.error('更新商家時發生錯誤:', error);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤'
        });
    }
});
exports.default = router;
