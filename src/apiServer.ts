import express from 'express';
import dotenv from 'dotenv';
import { neo4jClient } from './db';

// 導入路由
import bookingsRouter from './routes/bookings';
import customersRouter from './routes/customers';
import staffRouter from './routes/staff';
import servicesRouter from './routes/services';
import categoriesRouter from './routes/categories';
import membershipLevelsRouter from './routes/membershipLevels';
import advertisementsRouter from './routes/advertisements';
import userRelationshipsRouter from './routes/userRelationships';
import staffAvailabilityRouter from './routes/staffAvailability';
import notificationsRouter from './routes/notifications';
import subscriptionsRouter from './routes/subscriptions';
import businessRouter from './routes/business';
import usersRouter from './routes/users';
import staffServiceRouter from './routes/staffService';
import businessStatisticsRouter from './routes/businessStatistics';

dotenv.config();

// Express 錯誤處理介面
interface ErrorResponse {
  error_code: string;
  message: string;
  details?: any;
}

/**
 * 啟動 API 伺服器
 * @returns Express 應用程式實例
 */
export const startApiServer = async () => {
  const app = express();
  const port = process.env.API_PORT || process.env.PORT || 3000;

  app.use(express.json());

  // 註冊API路由
  app.use('/api/v1', bookingsRouter);
  app.use('/api/v1', customersRouter);
  app.use('/api/v1', staffRouter);
  app.use('/api/v1', servicesRouter);
  app.use('/api/v1', categoriesRouter);
  app.use('/api/v1', membershipLevelsRouter);
  app.use('/api/v1', advertisementsRouter);
  app.use('/api/v1', userRelationshipsRouter);
  app.use('/api/v1', staffAvailabilityRouter);
  app.use('/api/v1', notificationsRouter);
  app.use('/api/v1', subscriptionsRouter);
  app.use('/api/v1', businessRouter);
  app.use('/api/v1', usersRouter);
  app.use('/api/v1', staffServiceRouter);
  app.use('/api/v1', businessStatisticsRouter);

  // 全域錯誤處理中間件
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('全域錯誤處理:', err);
    res.status(500).json({
      error_code: 'SERVER_ERROR',
      message: '伺服器發生錯誤',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    } as ErrorResponse);
  });

  // 啟動 Express 應用
  app.listen(port, () => {
    console.error(`API 伺服器監聽於 port ${port}`);
    console.error(`API 基礎路徑: http://localhost:${port}/api/v1`);
  });

  return app;
};

// 如果直接執行此文件，則啟動 API 伺服器
if (require.main === module) {
  (async () => {
    try {
      // 連接到資料庫
      await neo4jClient.connect();
      console.error('已連接到 Neo4j 資料庫');
      
      // 啟動 API 伺服器
      await startApiServer();
    } catch (error) {
      console.error('啟動 API 伺服器時發生錯誤:', error);
      process.exit(1);
    }
  })();
}