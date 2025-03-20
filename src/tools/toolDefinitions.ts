/**
 * 工具定義檔案
 * 統一收集、管理所有工具定義，確保工具描述標準化與完整
 */
import { ToolDefinition } from '../types/tool';
import { scanToolDefinitions, checkToolCoverage } from '../utils/toolScanner';
import * as path from 'path';
import { createToolDefinition } from '../utils/toolRegistration';

// 工具目錄路徑
const TOOLS_DIR = path.join(__dirname);

// 暫時空陣列，將在初始化時填充
let _toolDefinitions: ToolDefinition[] = [];

/**
 * 初始化工具定義
 * 掃描工具目錄，收集所有符合標準的工具定義
 */
export async function initializeToolDefinitions(): Promise<ToolDefinition[]> {
  try {
    console.log('開始初始化工具定義...');
    
    // 掃描工具目錄，收集所有工具定義
    const tools = await scanToolDefinitions(TOOLS_DIR);
    
    // 檢查是否有工具實作但沒有定義
    await checkToolCoverage(TOOLS_DIR, tools);
    
    // 更新工具定義陣列
    _toolDefinitions = tools;
    
    console.log(`成功初始化 ${_toolDefinitions.length} 個工具定義`);
    return _toolDefinitions;
  } catch (error) {
    console.error('初始化工具定義時發生錯誤:', error);
    throw error;
  }
}

// 定義「列出工具」的工具
// 為工具列表工具手動建立標準化定義
export const listToolsTool = createToolDefinition(
  'listTools',
  '列出所有可用的工具及其描述',
  {
    type: 'object',
    properties: {},
    required: []
  },
  async () => {
    // 返回所有工具名稱和描述
    return {
      tools: _toolDefinitions.map(tool => ({
        name: tool.name,
        description: tool.description
      }))
    };
  }
);

// 用於外部存取的工具定義陣列
export const toolDefinitions: ToolDefinition[] = [];

/**
 * 初始化並填充工具定義陣列
 * 這個函數應該在應用程式啟動時被呼叫
 */
export async function loadToolDefinitions(): Promise<ToolDefinition[]> {
  const definedTools = await initializeToolDefinitions();
  
  // 清空現有陣列
  toolDefinitions.splice(0, toolDefinitions.length);
  
  // 添加列出工具的工具
  toolDefinitions.push(listToolsTool);
  
  // 添加所有掃描到的工具
  definedTools.forEach(tool => {
    // 避免重複添加 listTools
    if (tool.name !== 'listTools') {
      toolDefinitions.push(tool);
    }
  });
  
  console.log(`工具定義載入完成，共 ${toolDefinitions.length} 個工具可用`);
  return toolDefinitions;
}