import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ajv from '../utils/ajv'; // Use centralized AJV
import { neo4jClient } from '../db';
import { authenticateApiKey } from '../middleware/auth';
import { 
  CreateServiceRequest, 
  CreateServiceResponse,
  ServiceResponse,
  ServiceListResponse,
  ErrorResponse
} from '../types/api';

const router = express.Router();

// 建立服務 Schema
const createServiceSchema = {
  type: 'object',
  properties: {
    business_id: { type: 'string', format: 'uuid' },
    bookable_item_type_code: { type: 'string', enum: ['service', 'resource', 'event', 'teaching', 'table', 'room'] },
    bookable_item_name: { type: 'string', maxLength: 255 },
    bookable_item_description: { type: 'string', maxLength: 1000 },
    bookable_item_duration: { type: 'string' },
    bookable_item_price: { type: 'number', minimum: 0 }
  },
  required: ['business_id', 'bookable_item_type_code', 'bookable_item_name', 'bookable_item_duration'],
  additionalProperties: false
};

// 驗證函式
const validateCreateService = ajv.compile<CreateServiceRequest>(createServiceSchema);
// 建立服務 API
router.post('/services', authenticateApiKey, async (req: Request, res: Response) => {
  const serviceData = req.body as CreateServiceRequest;

  // 驗證請求數據
  if (!validateCreateService(serviceData)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '無效的請求參數',
      details: validateCreateService.errors
    } as ErrorResponse);
return;
  }

  try {
    // 檢查 business_id 是否存在
    const businessResult = await neo4jClient.runQuery(
      'MATCH (b:Business {business_id: $business_id}) RETURN b',
      { business_id: serviceData.business_id }
    );

    if (businessResult.records.length === 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '指定的商家不存在'
      } as ErrorResponse);
return;
    }

    // 創建新的服務 (BookableItem)
    const bookable_item_id = uuidv4();
    const createResult = await neo4jClient.runQuery(
      `CREATE (bi:BookableItem {
        bookable_item_id: $bookable_item_id,
        business_id: $business_id,
        bookable_item_type_code: $bookable_item_type_code,
        bookable_item_name: $bookable_item_name,
        bookable_item_description: $bookable_item_description,
        bookable_item_duration: $bookable_item_duration,
        bookable_item_price: $bookable_item_price,
        is_active: true,
        created_at: datetime(),
        updated_at: datetime()
      })
      RETURN bi`,
      {
        bookable_item_id,
        business_id: serviceData.business_id,
        bookable_item_type_code: serviceData.bookable_item_type_code,
        bookable_item_name: serviceData.bookable_item_name,
        bookable_item_description: serviceData.bookable_item_description || null,
        bookable_item_duration: serviceData.bookable_item_duration,
        bookable_item_price: serviceData.bookable_item_price || null
      }
    );

    if (createResult.records.length === 0) {
      res.status(500).json({
        error_code: 'SERVER_ERROR',
        message: '建立服務失敗'
      } as ErrorResponse);
return;
    }

    // 回傳成功結果
    res.status(201).json({ bookable_item_id } as CreateServiceResponse);
return;
  } catch (error) {
    console.error('建立服務時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 取得服務資訊 API
router.get('/services/:bookable_item_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { bookable_item_id } = req.params;

  try {
    // 查詢服務資訊
    const serviceResult = await neo4jClient.runQuery(
      'MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id}) RETURN bi',
      { bookable_item_id }
    );

    if (serviceResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的服務'
      } as ErrorResponse);
return;
    }

    // 轉換為響應格式
    const service = serviceResult.records[0].get('bi').properties;
    const serviceResponse: ServiceResponse = {
      bookable_item_id: service.bookable_item_id,
      business_id: service.business_id,
      bookable_item_type_code: service.bookable_item_type_code,
      bookable_item_name: service.bookable_item_name,
      bookable_item_description: service.bookable_item_description,
      bookable_item_duration: service.bookable_item_duration,
      bookable_item_price: service.bookable_item_price
    };

    res.status(200).json(serviceResponse);
return;
  } catch (error) {
    console.error('取得服務資訊時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 更新服務資訊 API
router.put('/services/:bookable_item_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { bookable_item_id } = req.params;
  const updateData = req.body;

  // 驗證服務是否存在
  try {
    const serviceResult = await neo4jClient.runQuery(
      'MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id}) RETURN bi',
      { bookable_item_id }
    );

    if (serviceResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的服務'
      } as ErrorResponse);
return;
    }

    // 構建更新查詢
    let updateQuery = 'MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id}) ';
    let setClause = 'SET bi.updated_at = datetime() ';
    const params: Record<string, any> = { bookable_item_id };

    // 動態添加更新欄位
    if (updateData.bookable_item_name) {
      setClause += ', bi.bookable_item_name = $bookable_item_name';
      params.bookable_item_name = updateData.bookable_item_name;
    }

    if (updateData.bookable_item_description !== undefined) {
      setClause += ', bi.bookable_item_description = $bookable_item_description';
      params.bookable_item_description = updateData.bookable_item_description;
    }

    if (updateData.bookable_item_duration) {
      setClause += ', bi.bookable_item_duration = $bookable_item_duration';
      params.bookable_item_duration = updateData.bookable_item_duration;
    }

    if (updateData.bookable_item_price !== undefined) {
      setClause += ', bi.bookable_item_price = $bookable_item_price';
      params.bookable_item_price = updateData.bookable_item_price;
    }

    if (updateData.bookable_item_type_code) {
      const allowedTypes = ['service', 'resource', 'event', 'teaching', 'table', 'room'];
      if (!allowedTypes.includes(updateData.bookable_item_type_code)) {
        res.status(400).json({
          error_code: 'BAD_REQUEST',
          message: '服務類型必須是 service、resource、event、teaching、table 或 room'
        } as ErrorResponse);
return;
      }
      setClause += ', bi.bookable_item_type_code = $bookable_item_type_code';
      params.bookable_item_type_code = updateData.bookable_item_type_code;
    }

    // 執行更新
    updateQuery += setClause + ' RETURN bi';
    await neo4jClient.runQuery(updateQuery, params);

    res.status(204).send();
return;
  } catch (error) {
    console.error('更新服務資訊時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 刪除服務 API
router.delete('/services/:bookable_item_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { bookable_item_id } = req.params;

  try {
    // 查詢服務是否存在
    const serviceResult = await neo4jClient.runQuery(
      'MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id}) RETURN bi',
      { bookable_item_id }
    );

    if (serviceResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的服務'
      } as ErrorResponse);
return;
    }

    // 檢查服務是否有未完成的預約
    const bookingResult = await neo4jClient.runQuery(
      `MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})<-[:BOOKS]-(b:Booking)
       WHERE b.booking_status_code IN ['pending', 'confirmed']
       RETURN b`,
      { bookable_item_id }
    );

    if (bookingResult.records.length > 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '該服務還有未完成的預約，無法刪除'
      } as ErrorResponse);
return;
    }

    // 刪除服務與關聯關係
    await neo4jClient.runQuery(
      `MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
       OPTIONAL MATCH (bi)-[r]-()
       DELETE r, bi`,
      { bookable_item_id }
    );

    res.status(204).send();
return;
  } catch (error) {
    console.error('刪除服務時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 查詢服務列表 API
router.get('/services', authenticateApiKey, async (req: Request, res: Response) => {
  const { business_id, category_id, type, limit = '10', offset = '0' } = req.query;

  if (!business_id) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '缺少必要參數: business_id'
    } as ErrorResponse);
return;
  }

  try {
    // 構建查詢
    let query = `MATCH (bi:BookableItem {business_id: $business_id})`;
    const params: Record<string, any> = { 
      business_id,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10)
    };

    // 如果指定了類別
    if (category_id) {
      query += ` MATCH (bi)-[:HAS_CATEGORY]->(c:Category {bookable_item_category_id: $category_id})`;
      params.category_id = category_id;
    }

    // 如果指定了類型
    if (type) {
      const allowedTypes = ['service', 'resource', 'event', 'teaching', 'table', 'room'];
      if (!allowedTypes.includes(type as string)) {
        res.status(400).json({
          error_code: 'BAD_REQUEST',
          message: '服務類型必須是 service、resource、event、teaching、table 或 room'
        } as ErrorResponse);
return;
      }
      query += ` WHERE bi.bookable_item_type_code = $type`;
      params.type = type;
    }

    // 總數查詢
    const countQuery = query + ` RETURN count(bi) as total`;
    const countResult = await neo4jClient.runQuery(countQuery, params);
    const total = countResult.records[0].get('total').toNumber();

    // 分頁查詢
    query += ` RETURN bi ORDER BY bi.bookable_item_name SKIP $offset LIMIT $limit`;
    const result = await neo4jClient.runQuery(query, params);

    // 轉換為響應格式
    const services = result.records.map(record => {
      const bi = record.get('bi').properties;
      return {
        bookable_item_id: bi.bookable_item_id,
        business_id: bi.business_id,
        bookable_item_type_code: bi.bookable_item_type_code,
        bookable_item_name: bi.bookable_item_name,
        bookable_item_description: bi.bookable_item_description,
        bookable_item_duration: bi.bookable_item_duration,
        bookable_item_price: bi.bookable_item_price
      } as ServiceResponse;
    });

    const response: ServiceListResponse = {
      total,
      services
    };

    res.status(200).json(response);
return;
  } catch (error) {
    console.error('查詢服務列表時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 推薦相關服務 API
router.get('/bookable_items/:bookable_item_id/recommendations/related_services', authenticateApiKey, async (req: Request, res: Response) => {
  const { bookable_item_id } = req.params;
  const { limit = '10' } = req.query;

  try {
    // 查詢服務是否存在
    const serviceResult = await neo4jClient.runQuery(
      'MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id}) RETURN bi',
      { bookable_item_id }
    );

    if (serviceResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的服務'
      } as ErrorResponse);
return;
    }

    // 查詢相關服務 (基於共同被預約的次數)
    const relatedResult = await neo4jClient.runQuery(
      `MATCH (bi1:BookableItem {bookable_item_id: $bookable_item_id})<-[:BOOKS]-(b:Booking)-[:BOOKS]->(bi2:BookableItem)
       WHERE bi1 <> bi2
       WITH bi2, count(b) AS common_bookings
       ORDER BY common_bookings DESC
       LIMIT $limit
       RETURN bi2, common_bookings`,
      { 
        bookable_item_id,
        limit: parseInt(limit as string, 10)
      }
    );

    // 轉換為響應格式
    const relatedServices = relatedResult.records.map(record => {
      const bi2 = record.get('bi2').properties;
      const common_bookings = record.get('common_bookings').toNumber();
      return {
        bookable_item_id: bi2.bookable_item_id,
        bookable_item_name: bi2.bookable_item_name,
        common_bookings
      };
    });

    res.status(200).json(relatedServices);
return;
  } catch (error) {
    console.error('推薦相關服務時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

export default router;
