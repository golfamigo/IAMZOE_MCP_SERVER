import dotenv from 'dotenv';
import { neo4jClient } from './db';
import { initializeDatabase } from './utils/databaseSetup';
import { startApiServer } from './apiServer';
import { startMcpServer } from './mcpServer';

dotenv.config();

/**
 * 主程式入口點
 * 根據環境變數決定啟動哪些服務
 */
(async () => {
  try {
    // 連接到資料庫
    await neo4jClient.connect();
    console.error('已連接到 Neo4j 資料庫');
    
    // 初始化資料庫設置 (索引和約束)
    await initializeDatabase();
    console.error('資料庫初始化完成');

    // 取得啟動模式
    const mode = process.env.START_MODE || 'all'; // 預設啟動所有服務
    
    // 根據模式啟動相應的服務
    if (mode === 'api' || mode === 'all') {
      await startApiServer();
      console.error('API 伺服器已啟動');
    }
    
    if (mode === 'mcp' || mode === 'all') {
      await startMcpServer();
      console.error('MCP 伺服器已啟動');
    }

    // 優雅關閉處理
    process.on('SIGINT', async () => {
      console.error('正在關閉應用程式...');
      await neo4jClient.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('啟動應用程式時發生錯誤:', error);
    process.exit(1);
  }
})();