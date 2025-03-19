import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ajv from '../utils/ajv';
import { neo4jClient } from '../db';
import { authenticateApiKey } from '../middleware/auth';
import { ErrorResponse } from '../types/api';

const router = express.Router();

// 建立員工可用性 Schema
const createStaffAvailabilitySchema = {
  type: 'object',
  properties: {
    staff_member_id: { type: 'string', format: 'uuid' },
    day_of_week: { type: 'integer', minimum: 0, maximum: 6 },
    start_time: { type: 'string', pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$' },
    end_time: { type: 'string', pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$' }
  },
  required: ['staff_member_id', 'day_of_week', 'start_time', 'end_time'],
  additionalProperties: false
};

// 驗證函式
const validateCreateStaffAvailability = ajv.compile(createStaffAvailabilitySchema);

// 建立員工可用性 API
router.post('/staff/availability', authenticateApiKey, async (req: Request, res: Response) => {
  const availabilityData: {
    staff_member_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  } = req.body;

  if (!validateCreateStaffAvailability(availabilityData)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '無效的請求參數',
      details: validateCreateStaffAvailability.errors
    } as ErrorResponse);
    return;
  }

  try {
    const staffResult = await neo4jClient.runQuery(
      'MATCH (s:Staff {staff_member_id: $staff_member_id}) RETURN s',
      { staff_member_id: availabilityData.staff_member_id }
    );

    if (staffResult.records.length === 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '指定的員工不存在'
      } as ErrorResponse);
      return;
    }

    const startTimeParts = availabilityData.start_time.split(':').map(Number);
    const endTimeParts = availabilityData.end_time.split(':').map(Number);
    const startSeconds = startTimeParts[0] * 3600 + startTimeParts[1] * 60 + startTimeParts[2];
    const endSeconds = endTimeParts[0] * 3600 + endTimeParts[1] * 60 + endTimeParts[2];
    if (endSeconds <= startSeconds) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '結束時間必須晚於開始時間'
      } as ErrorResponse);
      return;
    }

    const staff_availability_id = uuidv4();
    const createResult = await neo4jClient.runQuery(
      `CREATE (sa:StaffAvailability {
        staff_availability_id: $staff_availability_id,
        staff_member_id: $staff_member_id,
        day_of_week: $day_of_week,
        start_time: time($start_time),
        end_time: time($end_time),
        created_at: datetime(),
        updated_at: datetime()
      })
      WITH sa
      MATCH (s:Staff {staff_member_id: $staff_member_id})
      CREATE (s)-[:HAS_AVAILABILITY]->(sa)
      RETURN sa`,
      {
        staff_availability_id,
        staff_member_id: availabilityData.staff_member_id,
        day_of_week: availabilityData.day_of_week,
        start_time: availabilityData.start_time,
        end_time: availabilityData.end_time
      }
    );

    if (createResult.records.length === 0) {
      res.status(500).json({
        error_code: 'SERVER_ERROR',
        message: '建立員工可用性失敗'
      } as ErrorResponse);
      return;
    }

    res.status(201).json({ staff_availability_id });
  } catch (error) {
    console.error('建立員工可用性時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
  }
});

// 查詢員工可用性 API
router.get('/staff/:staff_member_id/availability', authenticateApiKey, async (req: Request, res: Response) => {
  const { staff_member_id } = req.params;

  try {
    const result = await neo4jClient.runQuery(
      `MATCH (s:Staff {staff_member_id: $staff_member_id})-[:HAS_AVAILABILITY]->(sa:StaffAvailability)
       RETURN sa`,
      { staff_member_id }
    );

    if (result.records.length === 0) {
      res.status(200).json([]);
      return;
    }

    const availability = result.records.map(record => {
      const sa = record.get('sa').properties;
      return {
        staff_availability_id: sa.staff_availability_id,
        day_of_week: sa.day_of_week.toNumber(),
        start_time: sa.start_time.toString(),
        end_time: sa.end_time.toString()
      };
    });

    res.status(200).json(availability);
  } catch (error) {
    console.error('查詢員工可用性時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
  }
});

// 查詢可用員工 API（根據服務和時間範圍）
router.get('/staff/available', authenticateApiKey, async (req: Request, res: Response) => {
  const { business_id, bookable_item_id, start_datetime, end_datetime } = req.query;

  if (!business_id || !bookable_item_id || !start_datetime || !end_datetime) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '缺少必要參數'
    } as ErrorResponse);
    return;
  }

  try {
    // 檢查服務是否存在
    const serviceResult = await neo4jClient.runQuery(
      'MATCH (bi:BookableItem {bookable_item_id: $bookable_item_id, business_id: $business_id}) RETURN bi',
      { bookable_item_id, business_id }
    );

    if (serviceResult.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的服務或商家'
      } as ErrorResponse);
      return;
    }

    // 驗證時間
    const startDateTime = new Date(start_datetime as string);
    const endDateTime = new Date(end_datetime as string);
    if (endDateTime <= startDateTime) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '結束時間必須晚於開始時間'
      } as ErrorResponse);
      return;
    }

    // 查詢可用員工
    const result = await neo4jClient.runQuery(
      `MATCH (s:Staff {business_id: $business_id, staff_member_is_active: true})-[:CAN_PROVIDE]->(bi:BookableItem {bookable_item_id: $bookable_item_id})
       MATCH (s)-[:HAS_AVAILABILITY]->(sa:StaffAvailability)
       WHERE sa.day_of_week = weekday(datetime($start_datetime))
         AND sa.start_time <= time($start_datetime)
         AND sa.end_time >= time($end_datetime)
       OPTIONAL MATCH (s)<-[:ASSIGNED_TO]-(b:Booking)
       WHERE b.booking_start_datetime <= datetime($end_datetime) 
         AND b.booking_end_datetime >= datetime($start_datetime)
         AND b.booking_status_code IN ['pending', 'confirmed']
       WITH s, sa, count(b) AS conflicting_bookings
       WHERE conflicting_bookings = 0
       RETURN s, sa`,
      {
        business_id,
        bookable_item_id,
        start_datetime: start_datetime as string,
        end_datetime: end_datetime as string
      }
    );

    const availableStaff = result.records.map(record => {
      const staff = record.get('s').properties;
      const availability = record.get('sa').properties;
      return {
        staff_member_id: staff.staff_member_id,
        staff_member_name: staff.staff_member_name,
        availability: {
          day_of_week: availability.day_of_week.toNumber(),
          start_time: availability.start_time.toString(),
          end_time: availability.end_time.toString()
        }
      };
    });

    res.status(200).json(availableStaff);
  } catch (error) {
    console.error('查詢可用員工時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
  }
});

export default router;