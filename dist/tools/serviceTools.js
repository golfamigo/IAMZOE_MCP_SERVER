"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceTools = exports.getAvailableSlots = exports.getService = exports.createService = exports.getAvailableSlotsImpl = exports.getServiceImpl = exports.createServiceImpl = void 0;
/**
 * 服務管理工具
 * 提供服務的創建、查詢和可用時間段計算功能
 */
const uuid_1 = require("uuid");
const db_1 = require("../db");
const neo4jUtils_1 = require("../utils/neo4jUtils");
const toolRegistration_1 = require("../utils/toolRegistration");
const tool_1 = require("../types/tool");
const errorHandling_1 = require("../utils/errorHandling");
// 輸入模式定義
const createServiceSchema = {
    type: 'object',
    properties: {
        business_id: { type: 'string', description: '商家 ID' },
        bookable_item_type_code: {
            type: 'string',
            description: '可預約項目類型代碼，例如：service, class, resource 等'
        },
        bookable_item_name: { type: 'string', description: '服務名稱' },
        bookable_item_description: { type: 'string', description: '服務描述' },
        bookable_item_duration: {
            type: 'string',
            description: '服務持續時間，例如：30 minutes, 1 hour 等'
        },
        bookable_item_price: { type: 'number', description: '服務價格' },
        bookable_item_max_capacity: { type: 'number', description: '最大容量' },
        category_id: { type: 'string', description: '類別 ID' }
    },
    required: ['business_id', 'bookable_item_type_code', 'bookable_item_name', 'bookable_item_duration']
};
const getServiceSchema = {
    type: 'object',
    properties: {
        bookable_item_id: { type: 'string', description: '可預約項目 ID' }
    },
    required: ['bookable_item_id']
};
const getAvailableSlotsSchema = {
    type: 'object',
    properties: {
        bookable_item_id: { type: 'string', description: '可預約項目 ID' },
        start_date: { type: 'string', description: '開始日期 (YYYY-MM-DD)' },
        end_date: { type: 'string', description: '結束日期 (YYYY-MM-DD)' }
    },
    required: ['bookable_item_id', 'start_date', 'end_date']
};
/**
 * 創建服務
 * @param params 服務資訊
 * @returns 新建服務的 ID
 */
const createServiceImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, createServiceSchema);
    const { business_id, bookable_item_type_code, bookable_item_name, bookable_item_description = '', bookable_item_duration, bookable_item_price = 0, bookable_item_max_capacity = 1, category_id } = params;
    // 驗證數據
    if (bookable_item_name.length > 255) {
        (0, errorHandling_1.throwInvalidParam)('bookable_item_name 超過最大長度 (255)');
    }
    if (bookable_item_description && bookable_item_description.length > 1000) {
        (0, errorHandling_1.throwInvalidParam)('bookable_item_description 超過最大長度 (1000)');
    }
    const bookable_item_id = (0, uuid_1.v4)();
    // 使用事務確保操作的原子性
    await db_1.neo4jClient.runInTransaction(async (tx) => {
        // 創建服務節點
        await tx.run(`CREATE (bi:BookableItem {
        bookable_item_id: $bookable_item_id,
        business_id: $business_id,
        bookable_item_type_code: $bookable_item_type_code,
        bookable_item_name: $bookable_item_name,
        bookable_item_description: $bookable_item_description,
        bookable_item_duration: $bookable_item_duration,
        bookable_item_price: $bookable_item_price,
        bookable_item_max_capacity: $bookable_item_max_capacity,
        is_active: true,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN bi`, {
            bookable_item_id,
            business_id,
            bookable_item_type_code,
            bookable_item_name,
            bookable_item_description,
            bookable_item_duration,
            bookable_item_price,
            bookable_item_max_capacity
        });
        // 建立服務與商家的關係
        await tx.run(`MATCH (b:Business {business_id: $business_id})
       MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
       CREATE (bi)-[:BELONGS_TO]->(b)`, { business_id, bookable_item_id });
        // 如果提供了 category_id，建立與類別的關係
        if (category_id) {
            try {
                await tx.run(`MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
           MATCH (cat:Category {bookable_item_category_id: $category_id})
           WHERE bi.business_id = cat.business_id
           CREATE (bi)-[:HAS_CATEGORY]->(cat)`, { bookable_item_id, category_id });
            }
            catch (error) {
                console.error('建立與類別的關係時出錯:', error);
                // 在事務中，如果這裡出錯，整個事務會回滾
                throw error;
            }
        }
    });
    return { bookable_item_id };
};
exports.createServiceImpl = createServiceImpl;
/**
 * 獲取服務資訊
 * @param params 查詢參數
 * @returns 服務詳細資訊
 */
const getServiceImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, getServiceSchema);
    const { bookable_item_id } = params;
    const result = await db_1.neo4jClient.runQuery(`MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
     RETURN bi`, { bookable_item_id });
    if (result.records.length === 0) {
        (0, errorHandling_1.throwIfNotFound)(null, '服務');
    }
    return result.records[0].get('bi').properties;
};
exports.getServiceImpl = getServiceImpl;
/**
 * 獲取可用時間段
 * @param params 查詢參數
 * @returns 可用時間段列表
 */
const getAvailableSlotsImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, getAvailableSlotsSchema);
    const { bookable_item_id, start_date, end_date } = params;
    // 獲取服務資訊
    const serviceResult = await db_1.neo4jClient.runQuery(`MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id})
     RETURN bi.business_id as business_id, bi.bookable_item_duration as duration, 
            bi.bookable_item_max_capacity as max_capacity, bi.is_active as is_active`, { bookable_item_id });
    if (serviceResult.records.length === 0) {
        (0, errorHandling_1.throwIfNotFound)(null, '可預約項目');
    }
    const businessId = serviceResult.records[0].get('business_id');
    const duration = serviceResult.records[0].get('duration');
    const maxCapacity = serviceResult.records[0].get('max_capacity');
    const isActive = serviceResult.records[0].get('is_active');
    if (!isActive) {
        (0, errorHandling_1.throwBusinessLogicError)('此項目已停用，無法查詢可用時間');
    }
    // 獲取商家營業時間
    const businessHoursResult = await db_1.neo4jClient.runQuery(`MATCH (b:Business {business_id: $business_id})-[:HAS_BUSINESS_HOURS]->(bh:BusinessHours)
     RETURN bh.day_of_week as day_of_week, bh.start_time as start_time, bh.end_time as end_time
     ORDER BY bh.day_of_week`, { business_id: businessId });
    // 如果沒有營業時間記錄，使用預設則為週一到週五 9:00-18:00
    const businessHours = [];
    if (businessHoursResult.records.length === 0) {
        // 預設營業時間：週一到週五 9:00-18:00
        for (let i = 1; i <= 5; i++) { // 1=週一, 5=週五
            businessHours.push({
                day_of_week: i,
                start_time: '09:00:00',
                end_time: '18:00:00'
            });
        }
    }
    else {
        businessHoursResult.records.forEach(record => {
            businessHours.push({
                day_of_week: (0, neo4jUtils_1.toJsNumber)(record.get('day_of_week')),
                start_time: record.get('start_time'),
                end_time: record.get('end_time')
            });
        });
    }
    // 獲取員工可用性
    const staffAvailabilityResult = await db_1.neo4jClient.runQuery(`MATCH (s:Staff {business_id: $business_id, staff_member_is_active: true})-[:CAN_PROVIDE]->(bi:BookableItem {bookable_item_id: $bookable_item_id})
     MATCH (s)-[:HAS_AVAILABILITY]->(sa:StaffAvailability)
     RETURN s.staff_member_id as staff_id, sa.day_of_week as day_of_week, 
            sa.start_time as start_time, sa.end_time as end_time`, { business_id: businessId, bookable_item_id });
    const staffAvailability = [];
    staffAvailabilityResult.records.forEach(record => {
        staffAvailability.push({
            staff_id: record.get('staff_id'),
            day_of_week: (0, neo4jUtils_1.toJsNumber)(record.get('day_of_week')),
            start_time: record.get('start_time'),
            end_time: record.get('end_time')
        });
    });
    // 獲取已存在的預約
    const existingBookingsResult = await db_1.neo4jClient.runQuery(`MATCH (b:Booking {bookable_item_id: $bookable_item_id})
     WHERE b.booking_status_code IN ['pending', 'confirmed']
     AND date(b.booking_start_datetime) >= date($start_date)
     AND date(b.booking_start_datetime) <= date($end_date)
     RETURN b.booking_start_datetime as start_datetime, 
            b.booking_end_datetime as end_datetime,
            b.booking_unit_count as unit_count`, { bookable_item_id, start_date, end_date });
    const existingBookings = [];
    existingBookingsResult.records.forEach(record => {
        existingBookings.push({
            start_datetime: (0, neo4jUtils_1.parseNeo4jDateTime)(record.get('start_datetime')),
            end_datetime: (0, neo4jUtils_1.parseNeo4jDateTime)(record.get('end_datetime')),
            unit_count: (0, neo4jUtils_1.toJsNumber)(record.get('unit_count'))
        });
    });
    // 轉換持續時間字串為分鐘數
    let durationMinutes = 60; // 預設 1 小時
    if (duration.includes('minutes')) {
        durationMinutes = parseInt(duration.replace(/[^0-9]/g, ''));
    }
    else if (duration.includes('hour')) {
        const hours = parseInt(duration.replace(/[^0-9]/g, ''));
        durationMinutes = hours * 60;
    }
    // 產生可用時間段
    const availableSlots = [];
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    // 遍歷所求的日期範圍
    for (let date = new Date(startDateObj); date <= endDateObj; date.setDate(date.getDate() + 1)) {
        const currentDay = date.getDay(); // 0=週日, 1=週一...
        // 檢查商家是否在該日營業
        const businessHoursForDay = businessHours.filter(bh => bh.day_of_week === currentDay);
        if (businessHoursForDay.length === 0)
            continue;
        for (const bh of businessHoursForDay) {
            // 獲取商家營業時間
            const startTimeParts = bh.start_time.split(':').map(Number);
            const endTimeParts = bh.end_time.split(':').map(Number);
            const businessStartTime = new Date(date);
            businessStartTime.setHours(startTimeParts[0], startTimeParts[1], startTimeParts[2]);
            const businessEndTime = new Date(date);
            businessEndTime.setHours(endTimeParts[0], endTimeParts[1], endTimeParts[2]);
            // 產生每個時間段
            for (let time = new Date(businessStartTime); time < businessEndTime; time.setMinutes(time.getMinutes() + durationMinutes)) {
                const slotStart = new Date(time);
                const slotEnd = new Date(time);
                slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);
                // 檢查時間段是否已經過去
                if (slotStart <= new Date())
                    continue;
                // 檢查時間段是否超過營業時間
                if (slotEnd > businessEndTime)
                    continue;
                // 檢查是否有員工可用
                let staffAvailable = false;
                if (staffAvailability.length === 0) {
                    // 如果沒有員工-服務關聯記錄，則設為可用
                    staffAvailable = true;
                }
                else {
                    // 檢查是否有員工在這個時間可用
                    const staffForDay = staffAvailability.filter(sa => sa.day_of_week === currentDay);
                    for (const sa of staffForDay) {
                        const staffStartTimeParts = sa.start_time.split(':').map(Number);
                        const staffEndTimeParts = sa.end_time.split(':').map(Number);
                        const staffStartTime = new Date(date);
                        staffStartTime.setHours(staffStartTimeParts[0], staffStartTimeParts[1], staffStartTimeParts[2]);
                        const staffEndTime = new Date(date);
                        staffEndTime.setHours(staffEndTimeParts[0], staffEndTimeParts[1], staffEndTimeParts[2]);
                        if (slotStart >= staffStartTime && slotEnd <= staffEndTime) {
                            staffAvailable = true;
                            break;
                        }
                    }
                }
                if (!staffAvailable)
                    continue;
                // 檢查時間段是否已滿
                let bookedUnits = 0;
                for (const booking of existingBookings) {
                    // 檢查預約是否與當前時間段重痕
                    if (slotStart < booking.end_datetime && slotEnd > booking.start_datetime) {
                        bookedUnits += booking.unit_count;
                    }
                }
                // 如果已預約數量少於最大容量，則時間段可用
                if (bookedUnits < maxCapacity) {
                    availableSlots.push({
                        start_datetime: slotStart.toISOString(),
                        end_datetime: slotEnd.toISOString()
                    });
                }
            }
        }
    }
    return availableSlots;
};
exports.getAvailableSlotsImpl = getAvailableSlotsImpl;
// 建立標準化工具定義
exports.createService = (0, toolRegistration_1.createToolDefinition)('createService', '創建新的服務項目', createServiceSchema, exports.createServiceImpl);
exports.getService = (0, toolRegistration_1.createToolDefinition)('getService', '獲取服務項目詳細資訊', getServiceSchema, exports.getServiceImpl);
exports.getAvailableSlots = (0, toolRegistration_1.createToolDefinition)('getAvailableSlots', '獲取服務的可用時間段', getAvailableSlotsSchema, exports.getAvailableSlotsImpl);
// 服務相關工具匯出
exports.serviceTools = {
    createService: exports.createService,
    getService: exports.getService,
    getAvailableSlots: exports.getAvailableSlots
};
