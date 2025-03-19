import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express from 'express';
import dotenv from 'dotenv';
import { neo4jClient } from './db';
import { tools } from './tools';

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

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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

// MCP Server 工具實現
// 接口已移至各個工具模塊中

const server = new Server(
  { name: 'iamzoe-mcp-server', version: '1.0.0' },
  { capabilities: { tools } } // 加入工具
);

server.onerror = (error) => console.error('[MCP Error]', error);

interface ErrorResponse {
  error_code: string;
  message: string;
}

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('全局錯誤處理:', err);
  res.status(500).json({
    error_code: 'SERVER_ERROR',
    message: '伺服器發生錯誤'
  } as ErrorResponse);
});

(async () => {
  try {
    await neo4jClient.connect();
    process.on('SIGINT', async () => {
      console.log('正在關閉應用程式...');
      await server.close();
      await neo4jClient.close();
      process.exit(0);
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('MCP Server 已啟動');

    app.listen(port, () => {
      console.log(`Express 應用程式監聽於 port ${port}`);
      console.log(`API 基礎路徑: http://localhost:${port}/api/v1`);
    });
  } catch (error) {
    console.error('啟動應用程式時發生錯誤:', error);
    process.exit(1);
  }
})();