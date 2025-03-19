import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import ajv from '../utils/ajv';
import { neo4jClient } from '../db';
import { authenticateApiKey } from '../middleware/auth';

const router = express.Router();

// 建立員工可用性 Schema
const createStaffAvailabilitySchema = {
  type: 'object',
  properties: {
    staff_member_id: { type: 'string', format: 'uuid' },
    day_of_week: { type: 'integer', minimum: 0, maximum: 6 }, // 0 = Sunday, 6 = Saturday
    start_time: { type: 'string', pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$' }, // HH:MM:SS
    end_time: { type: 'string', pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$' }
  },
  required: ['staff_member_id', 'day_of_week', 'start_time', 'end_time'],
  additionalProperties: false
};

// 驗證函式
const validateCreateStaffAvailability = ajv.compile(createStaffAvailabilitySchema);

// 建立員工可用性 API
router.post('/staff/availability', authenticateApiKey, async (req, res) => {
  const availabilityData = req.body;

  if (!validateCreateStaffAvailability(availabilityData)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '無效的請求參數',
      details: validateCreateStaffAvailability.errors
    });
    return;
  }

  try {
    // 檢查員工是否存在
    const staffResult = await neo4jClient.runQuery(
      'MATCH (s:Staff {staff_member_id: $staff_member_id}) RETURN s',
      { staff_member_id: availabilityData.staff_member_id }
    );

    if (staffResult.records.length === 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '指定的員工不存在'
      });
      return;
    }

    // 檢查時間是否有效
    const startTimeParts = availabilityData.start_time.split(':').map(Number);
    const endTimeParts = availabilityData.end_time.split(':').map(Number);
    const startSeconds = startTimeParts[0] * 3600 + startTimeParts[1] * 60 + startTimeParts[2];
    const endSeconds = endTimeParts[0] * 3600 + endTimeParts[1] * 60 + endTimeParts[2];
    if (endSeconds <= startSeconds) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '結束時間必須晚於開始時間'
      });
      return;
    }

    // 建立員工可用性
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
      });
      return;
    }

    res.status(201).json({ staff_availability_id });
  } catch (error) {
    console.error('建立員工可用性時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    });
  }
});

// 查詢員工可用性 API
router.get('/staff/:staff_member_id/availability', authenticateApiKey, async (req, res) => {
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
    });
  }
});

export default router;