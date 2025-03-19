import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import ajv from '../utils/ajv';
import { neo4jClient } from '../db';
import { authenticateApiKey } from '../middleware/auth';
import { ErrorResponse } from '../types/api';

const router = express.Router();

// 建立使用者 Schema
const createUserSchema = {
  type: 'object',
  properties: {
    user_name: { type: 'string', maxLength: 255 },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string', pattern: '^\\+?[1-9]\\d{1,14}$', nullable: true },
    line_id: { type: 'string', nullable: true },
    line_notification_enabled: { type: 'boolean', default: true },
    line_language_preference: { type: 'string', nullable: true }
  },
  required: ['user_name', 'email'],
  additionalProperties: false
};

// 驗證函式
const validateCreateUser = ajv.compile(createUserSchema);

// 建立使用者 API
router.post('/users', authenticateApiKey, async (req: Request, res: Response) => {
  const userData = req.body;

  if (!validateCreateUser(userData)) {
    res.status(400).json({
      error_code: 'BAD_REQUEST',
      message: '無效的請求參數',
      details: validateCreateUser.errors
    } as ErrorResponse);
    return;
  }

  try {
    // 檢查 email 是否唯一
    const emailCheck = await neo4jClient.runQuery(
      'MATCH (u:User {email: $email}) RETURN u',
      { email: userData.email }
    );

    if (emailCheck.records.length > 0) {
      res.status(400).json({
        error_code: 'BAD_REQUEST',
        message: '該電子郵件已被使用'
      } as ErrorResponse);
      return;
    }

    const user_id = uuidv4();
    const createResult = await neo4jClient.runQuery(
      `CREATE (u:User {
        user_id: $user_id,
        user_name: $user_name,
        email: $email,
        phone: $phone,
        line_id: $line_id,
        line_notification_enabled: $line_notification_enabled,
        line_language_preference: $line_language_preference,
        created_at: datetime(),
        updated_at: datetime()
      })
      RETURN u`,
      {
        user_id,
        user_name: userData.user_name,
        email: userData.email,
        phone: userData.phone || null,
        line_id: userData.line_id || null,
        line_notification_enabled: userData.line_notification_enabled ?? true,
        line_language_preference: userData.line_language_preference || null
      }
    );

    if (createResult.records.length === 0) {
      res.status(500).json({
        error_code: 'SERVER_ERROR',
        message: '建立使用者失敗'
      } as ErrorResponse);
      return;
    }

    res.status(201).json({ user_id });
  } catch (error) {
    console.error('建立使用者時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
  }
});

// 查詢使用者資訊 API
router.get('/users/:user_id', authenticateApiKey, async (req: Request, res: Response) => {
  const { user_id } = req.params;

  try {
    const result = await neo4jClient.runQuery(
      'MATCH (u:User {user_id: $user_id}) RETURN u',
      { user_id }
    );

    if (result.records.length === 0) {
      res.status(404).json({
        error_code: 'NOT_FOUND',
        message: '找不到指定的使用者'
      } as ErrorResponse);
      return;
    }

    const user = result.records[0].get('u').properties;
    const userResponse = {
      user_id: user.user_id,
      user_name: user.user_name,
      email: user.email,
      phone: user.phone,
      line_id: user.line_id,
      line_notification_enabled: user.line_notification_enabled,
      line_language_preference: user.line_language_preference
    };

    res.status(200).json(userResponse);
  } catch (error) {
    console.error('查詢使用者時發生錯誤:', error);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤'
    } as ErrorResponse);
  }
});

export default router;