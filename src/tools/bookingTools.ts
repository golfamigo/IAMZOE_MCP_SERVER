/**
 * 預約管理工具
 * 提供預約的查詢、建立和取消功能
 */
import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';
import { throwIfNotFound, throwInvalidParam, throwBusinessLogicError } from '../utils/errorHandling';
import { validateParams } from '../types/tool';
import { createToolDefinition } from '../utils/toolRegistration';

// 接口定義
export interface Booking {
  booking_id: string;
  business_id: string;
  booking_start_datetime: string;
  booking_end_datetime: string;
  booking_status_code: string;
  booking_unit_count: number;
  created_at: string;
  updated_at: string;
}

export interface GetBookingsParams {
  business_id: string;
}

export interface CreateBookingParams {
  business_id: string;
  bookable_item_id: string;
  start_datetime: string;
  end_datetime: string;
  unit_count: number;
}

export interface CancelBookingParams {
  booking_id: string;
  cancellation_reason?: string;
}

export interface CreateBookingResult {
  booking_id: string;
}

// 工具輸入模式定義
const getBookingsSchema = {
  type: 'object',
  properties: {
    business_id: { 
      type: 'string', 
      description: '商家 ID' 
    }
  },
  required: ['business_id']
};

const createBookingSchema = {
  type: 'object',
  properties: {
    business_id: { 
      type: 'string', 
      description: '商家 ID' 
    },
    bookable_item_id: { 
      type: 'string', 
      description: '可預約項目 ID' 
    },
    start_datetime: { 
      type: 'string', 
      description: '預約開始時間，ISO 8601 格式' 
    },
    end_datetime: { 
      type: 'string', 
      description: '預約結束時間，ISO 8601 格式' 
    },
    unit_count: { 
      type: 'number', 
      description: '預約單位數量' 
    }
  },
  required: ['business_id', 'bookable_item_id', 'start_datetime', 'end_datetime', 'unit_count']
};

const cancelBookingSchema = {
  type: 'object',
  properties: {
    booking_id: { 
      type: 'string', 
      description: '預約 ID' 
    },
    cancellation_reason: { 
      type: 'string', 
      description: '取消原因（可選）' 
    }
  },
  required: ['booking_id']
};

// 實作函數
/**
 * 獲取預約列表
 * @param params 查詢參數
 * @returns 預約列表
 */
export const getBookingsImpl = async (params: GetBookingsParams): Promise<Booking[]> => {
  // 驗證輸入參數
  validateParams(params, getBookingsSchema);
  const { business_id } = params;
  
  const result = await neo4jClient.runQuery(
    'MATCH (b:Booking {business_id: $business_id}) RETURN b LIMIT 10',
    { business_id }
  );
  
  return result.records.map(record => record.get('b').properties);
};

/**
 * 創建預約
 * @param params 預約信息
 * @returns 新建預約的 ID
 */
export const createBookingImpl = async (params: CreateBookingParams): Promise<CreateBookingResult> => {
  // 驗證輸入參數
  validateParams(params, createBookingSchema);
  const { business_id, bookable_item_id, start_datetime, end_datetime, unit_count } = params;
  
  // 驗證預約時間是否有效
  const startDate = new Date(start_datetime);
  const endDate = new Date(end_datetime);
  
  if (startDate >= endDate) {
    throwInvalidParam('預約結束時間必須晚於開始時間');
  }
  
  if (startDate < new Date()) {
    throwInvalidParam('無法創建過去時間的預約');
  }
  
  // 檢查可預約項目最大容量
  const itemResult = await neo4jClient.runQuery(
    `MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
     RETURN bi.bookable_item_max_capacity as max_capacity, bi.is_active as is_active`,
    { bookable_item_id }
  );
  
  if (itemResult.records.length === 0) {
    throwIfNotFound('BookableItem', bookable_item_id);
  }
  
  const maxCapacity = itemResult.records[0].get('max_capacity');
  const isActive = itemResult.records[0].get('is_active');
  
  if (!isActive) {
    throwBusinessLogicError('此項目已停用，無法預約');
  }
  
  // 檢查相同時間段的預約數量
  const existingBookingsResult = await neo4jClient.runQuery(
    `MATCH (b:Booking {business_id: $business_id, bookable_item_id: $bookable_item_id})
     WHERE b.booking_status_code IN ['pending', 'confirmed']
     AND datetime($start_datetime) < b.booking_end_datetime
     AND datetime($end_datetime) > b.booking_start_datetime
     RETURN sum(b.booking_unit_count) as total_units`,
    { business_id, bookable_item_id, start_datetime, end_datetime }
  );
  
  const totalUnits = existingBookingsResult.records[0].get('total_units') || 0;
  
  if (totalUnits + unit_count > maxCapacity) {
    throwBusinessLogicError(`預約數量超過可用容量，目前可用: ${maxCapacity - totalUnits}`);
  }
  
  const booking_id = uuidv4();
  
  await neo4jClient.runQuery(
    `CREATE (b:Booking {
      booking_id: $booking_id,
      business_id: $business_id,
      bookable_item_id: $bookable_item_id,
      booking_start_datetime: datetime($start_datetime),
      booking_end_datetime: datetime($end_datetime),
      booking_status_code: 'pending',
      booking_unit_count: $unit_count,
      created_at: datetime(),
      updated_at: datetime()
    }) RETURN b`,
    { booking_id, business_id, bookable_item_id, start_datetime, end_datetime, unit_count }
  );
  
  // 建立預約與可預約項目的關係
  await neo4jClient.runQuery(
    `MATCH (b:Booking {booking_id: $booking_id})
     MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
     CREATE (b)-[:BOOKS]->(bi)`,
    { booking_id, bookable_item_id }
  );
  
  return { booking_id };
};

/**
 * 取消預約
 * @param params 取消參數
 */
export const cancelBookingImpl = async (params: CancelBookingParams): Promise<void> => {
  // 驗證輸入參數
  validateParams(params, cancelBookingSchema);
  const { booking_id, cancellation_reason } = params;
  
  // 檢查預約是否存在
  const bookingResult = await neo4jClient.runQuery(
    `MATCH (b:Booking {booking_id: $booking_id})
     RETURN b.booking_status_code as status, b.booking_start_datetime as start_datetime`,
    { booking_id }
  );
  
  if (bookingResult.records.length === 0) {
    throwIfNotFound('Booking', booking_id);
  }
  
  const status = bookingResult.records[0].get('status');
  const startDatetime = new Date(bookingResult.records[0].get('start_datetime'));
  
  if (status === 'cancelled') {
    throwBusinessLogicError('此預約已經取消');
  }
  
  if (status === 'completed') {
    throwBusinessLogicError('已完成的預約不能取消');
  }
  
  // 檢查是否可以取消 (假設預約開始前 24 小時可以取消)
  const currentTime = new Date();
  const timeDiff = startDatetime.getTime() - currentTime.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  if (hoursDiff < 24) {
    throwBusinessLogicError('預約開始前 24 小時內不能取消');
  }
  
  // 更新預約狀態
  await neo4jClient.runQuery(
    `MATCH (b:Booking {booking_id: $booking_id})
     SET b.booking_status_code = 'cancelled',
         b.cancellation_reason = $cancellation_reason,
         b.updated_at = datetime()
     RETURN b`,
    { booking_id, cancellation_reason: cancellation_reason || '用戶取消' }
  );
};

// 建立標準化工具定義
export const getBookings = createToolDefinition(
  'getBookings',
  '獲取商家的預約列表',
  getBookingsSchema,
  getBookingsImpl
);

export const createBooking = createToolDefinition(
  'createBooking',
  '創建新的預約',
  createBookingSchema,
  createBookingImpl
);

export const cancelBooking = createToolDefinition(
  'cancelBooking',
  '取消已存在的預約',
  cancelBookingSchema,
  cancelBookingImpl
);

// 預約相關工具匯出
export const bookingTools = {
  getBookings,
  createBooking,
  cancelBooking
};
