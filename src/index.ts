import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express from 'express';
import dotenv from 'dotenv';
import { neo4jClient } from './db';

// 導入所有路由
import bookingsRouter from './routes/bookings';
import customersRouter from './routes/customers';
import staffRouter from './routes/staff';
import servicesRouter from './routes/services';
import categoriesRouter from './routes/categories';
import membershipLevelsRouter from './routes/membershipLevels';
import advertisementsRouter from './routes/advertisements';
import userRelationshipsRouter from './routes/userRelationships';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 中間件
app.use(express.json()); // 使用 express.json() 中間件解析 JSON 請求體

// 註冊API路由
app.use('/api/v1', bookingsRouter);
app.use('/api/v1', customersRouter);
app.use('/api/v1', staffRouter);
app.use('/api/v1', servicesRouter);
app.use('/api/v1', categoriesRouter);
app.use('/api/v1', membershipLevelsRouter);
app.use('/api/v1', advertisementsRouter);
app.use('/api/v1', userRelationshipsRouter);

// MCP Server 設定
const server = new Server(
  {
    name: 'iamzoe-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {}, // 稍後將在此處添加工具
    },
  }
);

// 基本錯誤處理
server.onerror = (error) => console.error('[MCP Error]', error);

// 全局錯誤處理中間件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('全局錯誤處理:', err);
  res.status(500).json({
    error_code: 'SERVER_ERROR',
    message: '伺服器發生錯誤'
  });
});

// 立即執行的 async 函數
(async () => {
  try {
    await neo4jClient.connect(); // 連接到資料庫
    
    // 設置關閉事件處理
    process.on('SIGINT', async () => {
      console.log('正在關閉應用程式...');
      await server.close();
      await neo4jClient.close();
      process.exit(0);
    });

    // 啟動 MCP Server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('MCP Server 已啟動');

    // 啟動 Express 應用程式
    app.listen(port, () => {
      console.log(`Express 應用程式監聽於 port ${port}`);
      console.log(`API 基礎路徑: http://localhost:${port}/api/v1`);
    });
  } catch (error) {
    console.error('啟動應用程式時發生錯誤:', error);
    process.exit(1);
  }
})();
