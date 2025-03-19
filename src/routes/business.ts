import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ajv from '../utils/ajv';
import { neo4jClient } from '../db';
import { authenticateApiKey } from '../middleware/auth';
import { ErrorResponse, CreateBusinessRequest, UpdateBusinessRequest } from '../types/api';

const router = express.Router();

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
const validateCreateBusiness = ajv.compile<CreateBusinessRequest>(createBusinessSchema);
const validateUpdateBusiness = ajv.compile<UpdateBusinessRequest>(updateBusinessSchema);

// 建立商家 API
router.post('/business', authenticateApiKey, async (req: Request, res: Response) => {
  const businessData = req.body as CreateBusinessRequest;

  if (!validateCreateBusiness(businessData)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '無效的請求參數',
      details: validateCreateBusiness.errors
    } as ErrorResponse);
    return;
  }

  try {
    const business_id = uuidv4();
    const createResult = await neo4jClient.runQuery(
      `CREATE (b:Business {
        business_id: $business_id,
        business_name: $business_name,
        business_timezone: $business_timezone,
        business_contact_email: $business_contact_email,
        business_contact_phone: $business_contact_phone,
        business_address: $business_address,
        business_location: $business_location ? point({latitude: $business_location.latitude, longitude: $business_location.longitude}) : null,
        line_destination: $line_destination,
        created_at: datetime(),
        updated_at: datetime()
      })
      RETURN b`,
      {
        business_id,
        business_name: businessData.business_name,
        business_timezone: businessData.business_timezone,
        business_contact_email: businessData.business_contact_email || null,
        business_contact_phone: businessData.business_contact_phone || null,
        business_address: businessData.business_address || null,
        business_location: businessData.business_location || null,
        line_destination: businessData.line_destination || null
      }
    );

    if (createResult.records.length === 0) {
      res.status(500).json({
        error_code: 'SERVER_ERROR',
        message: '建立商家失敗'
      } as ErrorResponse);
      return;
    }

    res.status(201).json({ business_id });
  } catch (error) {
    console.error('建立商家時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
  }
});

// 查詢商家資訊 API
router.get('/business/:business_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { business_id } = req.params;

  try {
    const result = await neo4jClient.runQuery(
      'MATCH (b:Business {business_id: $business_id}) RETURN b',
      { business_id }
    );

    if (result.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的商家'
      } as ErrorResponse);
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
  } catch (error) {
    console.error('查詢商家時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
  }
});

// 更新商家資訊 API
router.put('/business/:business_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { business_id } = req.params;
  const updateData = req.body as UpdateBusinessRequest;

  if (!validateUpdateBusiness(updateData)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '無效的請求參數',
      details: validateUpdateBusiness.errors
    } as ErrorResponse);
    return;
  }

  try {
    const result = await neo4jClient.runQuery(
      'MATCH (b:Business {business_id: $business_id}) RETURN b',
      { business_id }
    );

    if (result.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的商家'
      } as ErrorResponse);
      return;
    }

    let updateQuery = 'MATCH (b:Business {business_id: $business_id}) SET b.updated_at = datetime()';
    const params: Record<string, any> = { business_id };

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
      updateQuery += ', b.business_location = $business_location ? point({latitude: $business_location.latitude, longitude: $business_location.longitude}) : null';
      params.business_location = updateData.business_location;
    }
    if (updateData.line_destination !== undefined) {
      updateQuery += ', b.line_destination = $line_destination';
      params.line_destination = updateData.line_destination;
    }

    updateQuery += ' RETURN b';
    await neo4jClient.runQuery(updateQuery, params);

    res.status(204).send();
  } catch (error) {
    console.error('更新商家時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
  }
});

export default router;