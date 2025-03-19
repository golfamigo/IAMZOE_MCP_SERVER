import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ajv from '../utils/ajv'; // Import centralized AJV instance
import { neo4jClient } from '../db';
import { authenticateApiKey } from '../middleware/auth';
import { 
  CreateBookingRequest, 
  CreateBookingResponse,
  ErrorResponse,
  AvailableSlot
} from '../types/api';

const router = express.Router();

// 建立預約 Schema
const createBookingSchema = {
  type: 'object',
  properties: {
    business_id: { type: 'string', format: 'uuid' },
    bookable_item_id: { type: 'string', format: 'uuid' },
    booking_start_datetime: { type: 'string', format: 'date-time' },
    booking_end_datetime: { type: 'string', format: 'date-time' },
    booking_unit_count: { type: 'integer', minimum: 1 }
  },
  required: ['business_id', 'bookable_item_id', 'booking_start_datetime', 'booking_end_datetime', 'booking_unit_count'],
  additionalProperties: false
};

// 驗證函式
const validateCreateBooking = ajv.compile<CreateBookingRequest>(createBookingSchema);
// 建立預約 API
router.post('/bookings', authenticateApiKey, async (req: Request, res: Response) => {
  const bookingData = req.body as CreateBookingRequest;

  // 驗證請求數據
  if (!validateCreateBooking(bookingData)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '無效的請求參數',
      details: validateCreateBooking.errors
    } as ErrorResponse);
return;
  }

  try {
    // 檢查 business_id 是否存在
    const businessResult = await neo4jClient.runQuery(
      'MATCH (b:Business {business_id: $business_id}) RETURN b',
      { business_id: bookingData.business_id }
    );
    if (businessResult.records.length === 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '指定的商家不存在'
      } as ErrorResponse);
      return;
    }

    // 檢查 bookable_item_id 是否存在
    const serviceResult = await neo4jClient.runQuery(
      'MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id}) RETURN bi',
      { bookable_item_id: bookingData.bookable_item_id }
    );

    if (serviceResult.records.length === 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '指定的服務不存在'
      } as ErrorResponse);
      return;
    }

    // 檢查預約時間是否有效
    const startDatetime = new Date(bookingData.booking_start_datetime);
    const endDatetime = new Date(bookingData.booking_end_datetime);
    if (endDatetime <= startDatetime) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '預約結束時間必須晚於開始時間'
      } as ErrorResponse);
      return;
    }

    // 檢查是否有時段衝突
    const conflictResult = await neo4jClient.runQuery(
      `MATCH (b:Booking {business_id: $business_id})
       WHERE (b.booking_start_datetime <= datetime($end_datetime) AND b.booking_end_datetime >= datetime($start_datetime))
       RETURN b`,
      { 
        business_id: bookingData.business_id,
        start_datetime: bookingData.booking_start_datetime,
        end_datetime: bookingData.booking_end_datetime
      }
    );

    if (conflictResult.records.length > 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '該時段已有預約'
      } as ErrorResponse);
      return;
    }

    // Generate booking ID
    const booking_id = uuidv4();

    // 創建新的預約
    const createResult = await neo4jClient.runQuery(
      `CREATE (b:Booking {
        booking_id: $booking_id,
        business_id: $business_id,
        booking_start_datetime: datetime($booking_start_datetime),
        booking_end_datetime: datetime($booking_end_datetime),
        booking_status_code: 'pending',
        booking_unit_count: $booking_unit_count,
        created_at: datetime(),
        updated_at: datetime()
      })
      WITH b
      MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
      CREATE (b)-[:BOOKS]->(bi)
      RETURN b`,
      {
        booking_id,
        business_id: bookingData.business_id,
        booking_start_datetime: bookingData.booking_start_datetime,
        booking_end_datetime: bookingData.booking_end_datetime,
        booking_unit_count: bookingData.booking_unit_count,
        bookable_item_id: bookingData.bookable_item_id
      }
    );

    if (createResult.records.length === 0) {
      res.status(500).json({
        error_code: 'SERVER_ERROR',
        message: '建立預約失敗'
      } as ErrorResponse);
      return;
    }

    // 回傳成功結果
    res.status(201).json({ booking_id } as CreateBookingResponse);
return;
  } catch (error) {
    console.error('建立預約時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
    return;
  }
});

// 查詢可用時間 API
router.get('/bookable_items/:bookable_item_id/available_slots', authenticateApiKey, async (req: Request, res: Response) => {
  const bookable_item_id = req.params.bookable_item_id;
  const { start_date, end_date } = req.query;

  // 驗證參數
  if (!bookable_item_id || !start_date || !end_date) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '缺少必要參數'
    } as ErrorResponse);
    return;
  }

  // 驗證日期格式
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(start_date as string) || !dateRegex.test(end_date as string)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '日期格式無效，應為 YYYY-MM-DD'
    } as ErrorResponse);
    return;
  }

  try {
    // 檢查服務是否存在
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

    // 獲取服務時長
    const bookableItem = serviceResult.records[0].get('bi').properties;
    const serviceDuration = bookableItem.bookable_item_duration;
    const business_id = bookableItem.business_id;

    // 查詢已有的預約
    const bookingsResult = await neo4jClient.runQuery(
      `MATCH (b:Booking {business_id: $business_id})
       WHERE date(b.booking_start_datetime) >= date($start_date) AND date(b.booking_end_datetime) <= date($end_date)
       RETURN b.booking_start_datetime AS start, b.booking_end_datetime AS end
       ORDER BY b.booking_start_datetime`,
      { 
        business_id,
        start_date: start_date as string,
        end_date: end_date as string
      }
    );

    // 獲取商家的營業時間
    const hoursResult = await neo4jClient.runQuery(
      `MATCH (b:Business {business_id: $business_id}) 
       // 這裡應該有獲取營業時間的邏輯
       // 簡化實現，假設營業時間是 9:00 - 17:00
       RETURN b`,
      { business_id }
    );

    // 這裡簡化邏輯，假設營業時間是 9:00 - 17:00
    const businessHours = {
      start: '09:00:00',
      end: '17:00:00'
    };

    // 生成可用時段
    const availableSlots: AvailableSlot[] = [];
    const startDateObj = new Date(start_date as string);
    const endDateObj = new Date(end_date as string);
    
    // 計算天數差
    const dayDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    // 對每一天生成時段
    for (let i = 0; i <= dayDiff; i++) {
      const currentDate = new Date(startDateObj);
      currentDate.setDate(currentDate.getDate() + i);
      
      // 當天的營業開始時間
      const dayStart = new Date(currentDate);
      const [startHours, startMinutes] = businessHours.start.split(':').map(Number);
      dayStart.setHours(startHours, startMinutes, 0, 0);
      
      // 當天的營業結束時間
      const dayEnd = new Date(currentDate);
      const [endHours, endMinutes] = businessHours.end.split(':').map(Number);
      dayEnd.setHours(endHours, endMinutes, 0, 0);
      
      // 檢查該天的預約情況
      const bookedSlots = bookingsResult.records
        .filter(record => {
          const startTime = new Date(record.get('start').toString());
          return startTime.toDateString() === currentDate.toDateString();
        })
        .map(record => ({
          start: new Date(record.get('start').toString()),
          end: new Date(record.get('end').toString())
        }));
      
      // 生成時段 (每小時一個時段，簡化處理)
      let slotStart = new Date(dayStart);
      
      while (slotStart < dayEnd) {
        // 計算時段結束時間
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(slotStart.getHours() + 1); // 假設每個時段是1小時
        
        // 檢查是否與已預約時段重疊
        const isOverlapping = bookedSlots.some(
          bookedSlot => 
            (slotStart < bookedSlot.end && slotEnd > bookedSlot.start)
        );
        
        if (!isOverlapping && slotEnd <= dayEnd) {
          availableSlots.push({
            start_datetime: slotStart.toISOString(),
            end_datetime: slotEnd.toISOString()
          });
        }
        
        // 移動到下一個時段
        slotStart = new Date(slotEnd);
      }
    }

    res.status(200).json(availableSlots);
return;
  } catch (error) {
    console.error('查詢可用時段時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

// 取消預約 API
router.delete('/bookings/:booking_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { booking_id } = req.params;

  try {
    // 檢查預約是否存在
    const bookingResult = await neo4jClient.runQuery(
      'MATCH (b:Booking {booking_id: $booking_id}) RETURN b',
      { booking_id }
    );

    if (bookingResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的預約'
      } as ErrorResponse);
      return;
    }

    // 取得預約資訊
    const booking = bookingResult.records[0].get('b').properties;
    
    // 檢查是否可以取消 (預約開始時間前 24 小時)
    const startDatetime = new Date(booking.booking_start_datetime.toString());
    const now = new Date();
    const timeDiff = startDatetime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '無法取消預約，必須在預約時間前 24 小時取消'
      } as ErrorResponse);
      return;
    }

    // 更新預約狀態為取消
    await neo4jClient.runQuery(
      `MATCH (b:Booking {booking_id: $booking_id})
       SET b.booking_status_code = 'cancelled',
           b.updated_at = datetime(),
           b.cancellation_reason = 'Customer cancelled'
       RETURN b`,
      { booking_id }
    );

    res.status(204).send();
return;
  } catch (error) {
    console.error('取消預約時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
return;
  }
});

export default router;