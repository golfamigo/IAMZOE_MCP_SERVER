import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';

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

export interface CreateBookingResult {
  booking_id: string;
}

// 預約相關工具
export const bookingTools = {
  // 獲取預約列表
  getBookings: async (params: GetBookingsParams): Promise<Booking[]> => {
    const { business_id } = params;
    const result = await neo4jClient.runQuery(
      'MATCH (b:Booking {business_id: $business_id}) RETURN b LIMIT 10',
      { business_id }
    );
    return result.records.map(record => record.get('b').properties);
  },

  // 創建預約
  createBooking: async (params: CreateBookingParams): Promise<CreateBookingResult> => {
    const { business_id, bookable_item_id, start_datetime, end_datetime, unit_count } = params;
    const booking_id = uuidv4();
    const result = await neo4jClient.runQuery(
      `CREATE (b:Booking {
        booking_id: $booking_id,
        business_id: $business_id,
        booking_start_datetime: datetime($start_datetime),
        booking_end_datetime: datetime($end_datetime),
        booking_status_code: 'pending',
        booking_unit_count: $unit_count,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN b`,
      { booking_id, business_id, start_datetime, end_datetime, unit_count }
    );
    return { booking_id };
  }
};
