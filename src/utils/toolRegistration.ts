/**
 * 工具註冊工具
 * 用於自動註冊工具處理函數
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { ToolDefinition } from '../types/tool';
import { toMcpError } from './enhancedErrorHandling';

/**
 * 創建標準化工具定義
 * 簡化工具定義的創建過程
 * 
 * @param name 工具名稱
 * @param description 工具描述
 * @param inputSchema 輸入參數的 JSON Schema
 * @param execute 工具的執行函數
 * @returns 標準化的工具定義
 */
export function createToolDefinition(
  name: string,
  description: string,
  inputSchema: any,
  execute: (params: any) => Promise<any>
): ToolDefinition {
  return {
    name,
    description,
    inputSchema,
    execute
  };
}

/**
 * 註冊工具處理器
 * 將工具定義陣列註冊到 MCP 伺服器的工具呼叫處理器
 * 
 * @param server MCP 伺服器實例
 * @param tools 工具定義陣列
 */
export function registerToolHandlers(server: Server, tools: ToolDefinition[]): void {
  if (!tools || tools.length === 0) {
    console.warn('警告: 沒有找到任何工具定義可註冊');
    return;
  }
  
  // 建立工具名稱到工具定義的映射表，方便查詢
  const toolMap = new Map<string, ToolDefinition>();
  
  // 記錄重複的工具名稱
  const duplicateNames = new Set<string>();
  
  // 填充映射表，檢查重複名稱
  for (const tool of tools) {
    if (!tool.name) {
      console.warn('警告: 跳過沒有名稱的工具定義');
      continue;
    }
    
    if (toolMap.has(tool.name)) {
      console.warn(`警告: 發現重複的工具名稱: ${tool.name}`);
      duplicateNames.add(tool.name);
      continue;
    }
    
    toolMap.set(tool.name, tool);
  }
  
  if (duplicateNames.size > 0) {
    console.warn(`警告: 有 ${duplicateNames.size} 個重複的工具名稱: ${Array.from(duplicateNames).join(', ')}`);
  }
  
  // 設置工具呼叫處理器
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params; // 提供預設空物件
    
    try {
      // 查找工具定義
      const tool = toolMap.get(name);
      
      // 工具不存在
      if (!tool) {
        console.warn(`警告: 嘗試呼叫不存在的工具: ${name}`);
        throw new McpError(
          ErrorCode.MethodNotFound,
          `找不到名為 "${name}" 的工具`
        );
      }
      
      console.log(`執行工具: ${name}`);
      
      // 驗證參數
      if (tool.inputSchema && tool.inputSchema.required) {
        for (const requiredParam of tool.inputSchema.required) {
          if (args[requiredParam] === undefined) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `缺少必要參數: ${requiredParam}`
            );
          }
        }
      }
      
      // 執行工具
      try {
        const result = await tool.execute(args);
        
        // 格式化回傳結果
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' 
                ? result 
                : JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        // 轉換錯誤為標準的 MCP 錯誤
        const mcpError = toMcpError(error);
        
        return {
          content: [
            {
              type: 'text',
              text: `執行工具 "${name}" 時發生錯誤: ${mcpError.message}`
            }
          ],
          isError: true
        };
      }
    } catch (error) {
      // 處理工具參數驗證或工具查找時的錯誤
      const mcpError = toMcpError(error);
      
      return {
        content: [
          {
            type: 'text',
            text: mcpError.message
          }
        ],
        isError: true
      };
    }
  });
  
  console.log(`已註冊 ${toolMap.size} 個工具處理器`);
}