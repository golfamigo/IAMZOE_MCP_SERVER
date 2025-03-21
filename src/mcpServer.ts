import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import { neo4jClient } from './db';
import { toolDefinitions, loadToolDefinitions } from './tools/toolDefinitions';
import { ToolDefinition } from './types/tool';
import { registerToolHandlers } from './utils/toolRegistration';
import { initializeDatabase } from './utils/databaseSetup';

dotenv.config();

/**
 * 啟動 MCP 伺服器
 * @returns MCP 伺服器實例
 */
export const startMcpServer = async () => {
  // 載入所有工具定義
  console.error('正在載入工具定義...');
  await loadToolDefinitions();
  
  // 記錄所有註冊的工具
  console.error(`已載入 ${toolDefinitions.length} 個工具：`);
  
  // 檢查每個工具定義的完整性
  const incomplete: string[] = [];
  
  toolDefinitions.forEach(tool => {
    console.error(`- ${tool.name}: ${tool.description}`);
    
    let isIncomplete = false;
    
    // 檢查工具定義是否完整
    if (!tool.inputSchema) {
      console.error(`  警告: ${tool.name} 缺少輸入參數結構(inputSchema)`);
      isIncomplete = true;
    } else if (!tool.inputSchema.properties) {
      console.error(`  警告: ${tool.name} 的輸入參數結構缺少 properties 定義`);
      isIncomplete = true;
    } else if (!tool.inputSchema.required || tool.inputSchema.required.length === 0) {
      console.error(`  警告: ${tool.name} 的輸入參數結構缺少 required 欄位定義`);
      // 有些工具可能真的沒有必要參數，所以這只是警告
    }
    
    if (!tool.execute || typeof tool.execute !== 'function') {
      console.error(`  錯誤: ${tool.name} 缺少執行函數`);
      isIncomplete = true;
    }
    
    if (isIncomplete) {
      incomplete.push(tool.name);
    }
  });
  
  if (incomplete.length > 0) {
    console.error(`警告: 有 ${incomplete.length} 個工具定義不完整: ${incomplete.join(', ')}`);
    console.error('建議執行 "npm run generate-tools" 檢查並更新工具定義');
  }

  /**
   * 建立 MCP 伺服器實例
   * 提供詳細的伺服器資訊和能力描述
   */
  const server = new Server(
    { 
      name: 'iamzoe-mcp-server', 
      version: '1.0.0',
      description: 'IAM ZOE 預約系統 MCP 伺服器 - 提供商家、客戶、預約、員工和服務等管理功能'
    },
    { 
      capabilities: { 
        tools: {
          description: `提供完整的預約系統管理工具集，包含以下功能：
- 商家管理：建立和管理商家資訊、營業時間、位置等
- 客戶管理：客戶資料、會員等級、偏好設定管理
- 預約管理：預約建立、修改、取消、查詢
- 員工管理：員工資料、排班、專長服務管理
- 服務管理：服務項目、分類、定價管理
- 廣告與行銷：促銷活動、優惠券管理
- 數據統計：預約量、營收、客戶流量分析`,
          hasStreamingResponse: false
        },
        resources: {
          description: '提供預約系統相關資源存取，包括商家資訊、服務項目、預約紀錄等'
        }
      }
    }
  );

  /**
   * 設置工具列表處理器
   * 當 Agent 請求可用工具列表時，回傳所有註冊的工具定義
   * 包含完整的名稱、描述和輸入參數結構
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    try {
      // 確保所有工具都有必要的屬性
      const validTools = toolDefinitions.filter(tool => {
        const isValid = tool && 
                        typeof tool.name === 'string' && 
                        typeof tool.description === 'string' && 
                        tool.inputSchema !== undefined;
        
        if (!isValid) {
          console.error(`警告: 跳過無效的工具定義: ${tool?.name || '未命名'}`);
        }
        
        return isValid;
      });
      
      // 對工具按功能分類進行分組，方便 Agent 理解
      const toolsByCategory = {
        '商家管理': validTools.filter(t => t.name.includes('business') || t.name.includes('Business')),
        '客戶管理': validTools.filter(t => t.name.includes('customer') || t.name.includes('Customer')),
        '預約管理': validTools.filter(t => t.name.includes('booking') || t.name.includes('Booking')),
        '員工管理': validTools.filter(t => t.name.includes('staff') || t.name.includes('Staff')),
        '服務管理': validTools.filter(t => t.name.includes('service') || t.name.includes('Service')),
        '廣告管理': validTools.filter(t => t.name.includes('advertisement') || t.name.includes('Advertisement')),
        '會員等級': validTools.filter(t => t.name.includes('membershipLevel') || t.name.includes('MembershipLevel')),
        '通知管理': validTools.filter(t => t.name.includes('notification') || t.name.includes('Notification')),
        '訂閱管理': validTools.filter(t => t.name.includes('subscription') || t.name.includes('Subscription')),
        '用戶關係': validTools.filter(t => t.name.includes('userRelationship') || t.name.includes('UserRelationship')),
        '用戶管理': validTools.filter(t => t.name.includes('user') || t.name.includes('User')),
        '分類管理': validTools.filter(t => t.name.includes('category') || t.name.includes('Category')),
        '其他工具': validTools.filter(t => 
          !t.name.includes('business') && !t.name.includes('Business') && 
          !t.name.includes('customer') && !t.name.includes('Customer') && 
          !t.name.includes('booking') && !t.name.includes('Booking') && 
          !t.name.includes('staff') && !t.name.includes('Staff') && 
          !t.name.includes('service') && !t.name.includes('Service') && 
          !t.name.includes('advertisement') && !t.name.includes('Advertisement') && 
          !t.name.includes('membershipLevel') && !t.name.includes('MembershipLevel') && 
          !t.name.includes('notification') && !t.name.includes('Notification') && 
          !t.name.includes('subscription') && !t.name.includes('Subscription') && 
          !t.name.includes('userRelationship') && !t.name.includes('UserRelationship') && 
          !t.name.includes('user') && !t.name.includes('User') && 
          !t.name.includes('category') && !t.name.includes('Category')
        )
      };
      
      console.error('工具分類統計:');
      Object.entries(toolsByCategory).forEach(([category, tools]) => {
        console.error(`- ${category}: ${tools.length} 個工具`);
      });
      
      return {
        tools: validTools.map((tool: ToolDefinition) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    } catch (error) {
      console.error('列出工具時發生錯誤:', error);
      throw new McpError(
        ErrorCode.InternalError,
        '列出工具時發生內部錯誤'
      );
    }
  });

  // 註冊工具處理器 - 處理工具呼叫並執行相應的工具實現
  registerToolHandlers(server, toolDefinitions);
  
  // 設置 MCP 伺服器錯誤處理
  server.onerror = (error) => {
    console.error('[MCP Error]', error);
    // 這裡可以添加更多錯誤處理邏輯，例如記錄到日誌系統或發送錯誤通知
  };

  // 啟動 MCP 伺服器
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server 已啟動');

  return server;
};

// 如果直接執行此文件，則啟動 MCP 伺服器
if (require.main === module) {
  (async () => {
    try {
      // 連接到資料庫
      await neo4jClient.connect();
      console.error('已連接到 Neo4j 資料庫');
      
      // 初始化資料庫設置 (索引和約束)
      await initializeDatabase();
      console.error('資料庫初始化完成');

      // 啟動 MCP 伺服器
      await startMcpServer();

      // 優雅關閉處理
      process.on('SIGINT', async () => {
        console.error('正在關閉 MCP 伺服器...');
        await neo4jClient.close();
        process.exit(0);
      });
    } catch (error) {
      console.error('啟動 MCP 伺服器時發生錯誤:', error);
      process.exit(1);
    }
  })();
}