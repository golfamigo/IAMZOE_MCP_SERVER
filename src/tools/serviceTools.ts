import { v4 as uuidv4 } from 'uuid';
import { neo4jClient } from '../db';

// 接口定義
export interface BookableItem {
  bookable_item_id: string;
  business_id: string;
  bookable_item_type_code: string;
  bookable_item_name: string;
  bookable_item_description: string;
  bookable_item_duration: string;
  bookable_item_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceParams {
  business_id: string;
  bookable_item_type_code: string;
  bookable_item_name: string;
  bookable_item_description?: string;
  bookable_item_duration: string;
  bookable_item_price?: number;
}

export interface CreateServiceResult {
  bookable_item_id: string;
}

export interface GetServiceParams {
  bookable_item_id: string;
}

export interface GetAvailableSlotsParams {
  bookable_item_id: string;
  start_date: string;
  end_date: string;
}

export interface TimeSlot {
  start_datetime: string;
  end_datetime: string;
}

// 服務相關工具
export const serviceTools = {
  // 創建服務
  createService: async (params: CreateServiceParams): Promise<CreateServiceResult> => {
    const { 
      business_id, 
      bookable_item_type_code, 
      bookable_item_name,
      bookable_item_description = '',
      bookable_item_duration,
      bookable_item_price = 0
    } = params;
    
    const bookable_item_id = uuidv4();
    
    await neo4jClient.runQuery(
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
      }) RETURN bi`,
      { 
        bookable_item_id, 
        business_id, 
        bookable_item_type_code, 
        bookable_item_name,
        bookable_item_description,
        bookable_item_duration,
        bookable_item_price
      }
    );
    
    return { bookable_item_id };
  },
  
  // 獲取服務資訊
  getService: async (params: GetServiceParams): Promise<BookableItem> => {
    const { bookable_item_id } = params;
    
    const result = await neo4jClient.runQuery(
      `MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
       RETURN bi`,
      { bookable_item_id }
    );
    
    if (result.records.length === 0) {
      throw new Error('Service not found');
    }
    
    return result.records[0].get('bi').properties;
  },
  
  // 獲取可用時間段
  getAvailableSlots: async (params: GetAvailableSlotsParams): Promise<TimeSlot[]> => {
    const { bookable_item_id, start_date, end_date } = params;
    
    // 這裡是一個簡化的實現，實際上應該考慮營業時間、員工排班、現有預約等因素
    // 假設每天 9:00-17:00 之間每小時有一個可用時間段
    
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const availableSlots: TimeSlot[] = [];
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      for (let hour = 9; hour < 17; hour++) {
        const startHour = `${hour.toString().padStart(2, '0')}:00:00`;
        const endHour = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
        
        availableSlots.push({
          start_datetime: `${dateStr}T${startHour}Z`,
          end_datetime: `${dateStr}T${endHour}Z`
        });
      }
    }
    
    return availableSlots;
  }
};
