import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express from 'express';
import dotenv from 'dotenv';
import { neo4jClient } from './db';
import { tools } from './tools';
import { initializeDatabase } from './utils/databaseSetup';

// 导入路由
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

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 注册API路由
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

// MCP Server 工具实现
// 接口已移至各个工具模块中

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
  console.error('全局错误处理:', err);
  res.status(500).json({
    error_code: 'SERVER_ERROR',
    message: '服务器发生错误'
  } as ErrorResponse);
});

(async () => {
  try {
    await neo4jClient.connect();
    
    // 初始化数据库设置 (索引和约束)
    await initializeDatabase();
    
    process.on('SIGINT', async () => {
      console.log('正在关闭应用程序...');
      await server.close();
      await neo4jClient.close();
      process.exit(0);
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('MCP Server 已启动');

    app.listen(port, () => {
      console.log(`Express 应用程序监听于 port ${port}`);
      console.log(`API 基础路径: http://localhost:${port}/api/v1`);
    });
  } catch (error) {
    console.error('启动应用程序时发生错误:', error);
    process.exit(1);
  }
})();