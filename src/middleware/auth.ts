import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    res.status(401).json({
      error_code: 'UNAUTHORIZED',
      message: '缺少 API Key'
    });
    return;
  }

  // 驗證 API Key 是否匹配環境變數
  const validApiKey = process.env.API_KEY;
  if (apiKey !== validApiKey) {
    res.status(403).json({
      error_code: 'FORBIDDEN',
      message: '無效的 API Key'
    });
    return;
  }

  next();
};