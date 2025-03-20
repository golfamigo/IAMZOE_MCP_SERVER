/**
 * 工具索引檔案
 * 匯集所有工具定義並匯出標準化介面
 */

// 導入標準化工具定義
import { toolDefinitions, listToolsTool } from './toolDefinitions';

// 首先定義工具名稱列表 - 用於外部參考
export const toolNames = toolDefinitions.map(tool => tool.name);

/**
 * 建立工具映射表
 * 將所有工具定義轉換為名稱->執行函數的映射
 */
function createToolsMap() {
  const toolMap: Record<string, (...args: any[]) => Promise<any>> = {};
  
  // 將每個工具的 execute 函數添加到映射表
  toolDefinitions.forEach(tool => {
    toolMap[tool.name] = tool.execute;
  });
  
  return toolMap;
}

/**
 * 所有工具定義的映射表
 * 將所有註冊工具統一匯出
 */
export const tools = createToolsMap();

// 確保映射表包含所有應該有的工具
console.log(`tools 映射表中共有 ${Object.keys(tools).length} 個工具`);

// 導出所有工具和工具定義
export { toolDefinitions };
