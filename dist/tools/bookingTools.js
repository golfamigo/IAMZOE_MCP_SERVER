"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingTools = exports.cancelBooking = exports.createBooking = exports.getBookings = exports.cancelBookingImpl = exports.createBookingImpl = exports.getBookingsImpl = void 0;
/**
 * 預約管理工具
 * 提供預約的查詢、建立和取消功能
 */
const uuid_1 = require("uuid");
const db_1 = require("../db");
const errorHandling_1 = require("../utils/errorHandling");
const tool_1 = require("../types/tool");
const toolRegistration_1 = require("../utils/toolRegistration");
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
        customer_profile_id: {
            type: 'string',
            description: '客戶資料 ID'
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
    required: ['business_id', 'customer_profile_id', 'bookable_item_id', 'start_datetime', 'end_datetime', 'unit_count']
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
const getBookingsImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, getBookingsSchema);
    const { business_id } = params;
    const result = await db_1.neo4jClient.runQuery('MATCH (b:Booking {business_id: $business_id}) RETURN b LIMIT 10', { business_id });
    return result.records.map(record => record.get('b').properties);
};
exports.getBookingsImpl = getBookingsImpl;
/**
 * 創建預約
 * @param params 預約信息
 * @returns 新建預約的 ID
 */
const createBookingImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, createBookingSchema);
    const { business_id, customer_profile_id, bookable_item_id, start_datetime, end_datetime, unit_count } = params;
    // 驗證預約時間是否有效
    const startDate = new Date(start_datetime);
    const endDate = new Date(end_datetime);
    if (startDate >= endDate) {
        (0, errorHandling_1.throwInvalidParam)('預約結束時間必須晚於開始時間');
    }
    if (startDate < new Date()) {
        (0, errorHandling_1.throwInvalidParam)('無法創建過去時間的預約');
    }
    // 檢查可預約項目最大容量
    const itemResult = await db_1.neo4jClient.runQuery(`MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
     RETURN bi.bookable_item_max_capacity as max_capacity, bi.is_active as is_active`, { bookable_item_id });
    if (itemResult.records.length === 0) {
        (0, errorHandling_1.throwIfNotFound)('BookableItem', bookable_item_id);
    }
    const maxCapacity = itemResult.records[0].get('max_capacity');
    const isActive = itemResult.records[0].get('is_active');
    if (!isActive) {
        (0, errorHandling_1.throwBusinessLogicError)('此項目已停用，無法預約');
    }
    // 檢查相同時間段的預約數量
    const existingBookingsResult = await db_1.neo4jClient.runQuery(`MATCH (b:Booking {business_id: $business_id, bookable_item_id: $bookable_item_id})
     WHERE b.booking_status_code IN ['pending', 'confirmed']
     AND datetime($start_datetime) < b.booking_end_datetime
     AND datetime($end_datetime) > b.booking_start_datetime
     RETURN sum(b.booking_unit_count) as total_units`, { business_id, bookable_item_id, start_datetime, end_datetime });
    // 明確轉換 BigInt 為 Number
    let totalUnits = 0;
    const rawTotalUnits = existingBookingsResult.records[0].get('total_units');
    if (rawTotalUnits) {
        // 檢查是否為 Neo4j 整數類型 (帶有 low/high 屬性)
        if (rawTotalUnits.low !== undefined && rawTotalUnits.high !== undefined) {
            totalUnits = Number(rawTotalUnits.low);
        }
        else {
            totalUnits = Number(rawTotalUnits);
        }
    }
    // 同樣轉換最大容量為標準 JavaScript 數字
    let maxCapacityNum = 0;
    if (maxCapacity && maxCapacity.low !== undefined && maxCapacity.high !== undefined) {
        maxCapacityNum = Number(maxCapacity.low);
    }
    else {
        maxCapacityNum = Number(maxCapacity);
    }
    // 使用轉換後的數字進行比較
    if (totalUnits + Number(unit_count) > maxCapacityNum) {
        (0, errorHandling_1.throwBusinessLogicError)(`預約數量超過可用容量，目前可用: ${maxCapacityNum - totalUnits}`);
    }
    // 檢查預約時間是否與員工可用時間衝突
    // 1. 獲取可以提供該服務的員工列表
    const staffResult = await db_1.neo4jClient.runQuery(`MATCH (s:Staff)-[:CAN_PROVIDE]->(bi:BookableItem {bookable_item_id: $bookable_item_id})
     WHERE s.business_id = $business_id AND s.staff_member_is_active = true
     RETURN s.staff_member_id as staff_id`, { business_id, bookable_item_id });
    if (staffResult.records.length === 0) {
        (0, errorHandling_1.throwBusinessLogicError)('沒有員工可以提供此服務');
    }
    // 2. 獲取預約日期是星期幾
    const dayOfWeek = startDate.getDay(); // 0 = 週日, 1 = 週一, ..., 6 = 週六
    // 3. 獲取預約的開始和結束時間（僅時間部分）
    const bookingStartTime = startDate.toTimeString().substring(0, 8); // 格式: HH:MM:SS
    const bookingEndTime = endDate.toTimeString().substring(0, 8); // 格式: HH:MM:SS
    // 4. 檢查是否有員工在該時間段可用
    const availabilityResult = await db_1.neo4jClient.runQuery(`MATCH (s:Staff)-[:HAS_AVAILABILITY]->(sa:StaffAvailability)
     WHERE s.staff_member_id IN $staff_ids
     AND sa.day_of_week = $day_of_week
     AND sa.start_time <= $booking_start_time
     AND sa.end_time >= $booking_end_time
     RETURN s.staff_member_id as available_staff_id`, {
        staff_ids: staffResult.records.map(record => record.get('staff_id')),
        day_of_week: dayOfWeek,
        booking_start_time: bookingStartTime,
        booking_end_time: bookingEndTime
    });
    if (availabilityResult.records.length === 0) {
        (0, errorHandling_1.throwBusinessLogicError)('指定時間段沒有可用員工，請選擇其他時間');
    }
    // 5. 檢查員工在該時間段是否已有其他預約
    const availableStaffIds = availabilityResult.records.map(record => record.get('available_staff_id'));
    // 檢查員工在該時間段是否已有其他預約
    // 注意：這裡假設預約與員工之間的關係是 PROVIDES_SERVICE_FOR
    const staffBookingResult = await db_1.neo4jClient.runQuery(`MATCH (s:Staff)-[:PROVIDES_SERVICE_FOR]->(b:Booking)
     WHERE s.staff_member_id IN $staff_ids
     AND b.booking_status_code IN ['pending', 'confirmed']
     AND datetime($start_datetime) < b.booking_end_datetime
     AND datetime($end_datetime) > b.booking_start_datetime
     RETURN s.staff_member_id as busy_staff_id`, {
        staff_ids: availableStaffIds,
        start_datetime,
        end_datetime
    });
    // 從可用員工中排除已有預約的員工
    const busyStaffIds = staffBookingResult.records.map(record => record.get('busy_staff_id'));
    const finalAvailableStaffIds = availableStaffIds.filter(id => !busyStaffIds.includes(id));
    if (finalAvailableStaffIds.length === 0) {
        (0, errorHandling_1.throwBusinessLogicError)('所有可提供此服務的員工在指定時間段已有其他預約，請選擇其他時間');
    }
    const booking_id = (0, uuid_1.v4)();
    await db_1.neo4jClient.runQuery(`CREATE (b:Booking {
      booking_id: $booking_id,
      business_id: $business_id,
      customer_profile_id: $customer_profile_id,
      bookable_item_id: $bookable_item_id,
      booking_start_datetime: datetime($start_datetime),
      booking_end_datetime: datetime($end_datetime),
      booking_status_code: 'pending',
      booking_unit_count: $unit_count,
      created_at: datetime(),
      updated_at: datetime()
    }) RETURN b`, { booking_id, business_id, customer_profile_id, bookable_item_id, start_datetime, end_datetime, unit_count });
    // 建立預約與可預約項目的關係
    await db_1.neo4jClient.runQuery(`MATCH (b:Booking {booking_id: $booking_id})
     MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
     CREATE (b)-[:BOOKS]->(bi)`, { booking_id, bookable_item_id });
    // 建立預約與商家的關係
    await db_1.neo4jClient.runQuery(`MATCH (b:Booking {booking_id: $booking_id})
     MATCH (bus:Business {business_id: $business_id})
     CREATE (b)-[:BELONGS_TO]->(bus)`, { booking_id, business_id });
    // 建立預約與客戶的關係
    await db_1.neo4jClient.runQuery(`MATCH (b:Booking {booking_id: $booking_id})
     MATCH (c:Customer {customer_profile_id: $customer_profile_id})
     CREATE (c)-[:MADE]->(b)`, { booking_id, customer_profile_id });
    // 選擇一個可用的員工來提供服務
    // 這裡簡單地選擇第一個可用的員工，實際應用中可能需要更複雜的分配邏輯
    if (finalAvailableStaffIds.length > 0) {
        const assigned_staff_id = finalAvailableStaffIds[0];
        // 建立預約與員工的關係
        await db_1.neo4jClient.runQuery(`MATCH (b:Booking {booking_id: $booking_id})
       MATCH (s:Staff {staff_member_id: $assigned_staff_id})
       CREATE (s)-[:PROVIDES_SERVICE_FOR]->(b)`, { booking_id, assigned_staff_id });
    }
    return { booking_id };
};
exports.createBookingImpl = createBookingImpl;
/**
 * 取消預約
 * @param params 取消參數
 */
const cancelBookingImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, cancelBookingSchema);
    const { booking_id, cancellation_reason } = params;
    // 檢查預約是否存在
    const bookingResult = await db_1.neo4jClient.runQuery(`MATCH (b:Booking {booking_id: $booking_id})
     RETURN b.booking_status_code as status, b.booking_start_datetime as start_datetime`, { booking_id });
    if (bookingResult.records.length === 0) {
        (0, errorHandling_1.throwIfNotFound)('Booking', booking_id);
    }
    const status = bookingResult.records[0].get('status');
    const startDatetime = new Date(bookingResult.records[0].get('start_datetime'));
    if (status === 'cancelled') {
        (0, errorHandling_1.throwBusinessLogicError)('此預約已經取消');
    }
    if (status === 'completed') {
        (0, errorHandling_1.throwBusinessLogicError)('已完成的預約不能取消');
    }
    // 檢查是否可以取消 (假設預約開始前 24 小時可以取消)
    const currentTime = new Date();
    const timeDiff = startDatetime.getTime() - currentTime.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    if (hoursDiff < 24) {
        (0, errorHandling_1.throwBusinessLogicError)('預約開始前 24 小時內不能取消');
    }
    // 更新預約狀態
    await db_1.neo4jClient.runQuery(`MATCH (b:Booking {booking_id: $booking_id})
     SET b.booking_status_code = 'cancelled',
         b.cancellation_reason = $cancellation_reason,
         b.updated_at = datetime()
     RETURN b`, { booking_id, cancellation_reason: cancellation_reason || '用戶取消' });
    return { success: true };
};
exports.cancelBookingImpl = cancelBookingImpl;
// 建立標準化工具定義
exports.getBookings = (0, toolRegistration_1.createToolDefinition)('getBookings', '獲取商家的預約列表', getBookingsSchema, exports.getBookingsImpl);
exports.createBooking = (0, toolRegistration_1.createToolDefinition)('createBooking', '創建新的預約', createBookingSchema, exports.createBookingImpl);
exports.cancelBooking = (0, toolRegistration_1.createToolDefinition)('cancelBooking', '取消已存在的預約', cancelBookingSchema, exports.cancelBookingImpl);
// 預約相關工具匯出
exports.bookingTools = {
    getBookings: exports.getBookings,
    createBooking: exports.createBooking,
    cancelBooking: exports.cancelBooking
};
