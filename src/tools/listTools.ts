/**
 * 工具列表工具
 * 提供列出所有可用工具的功能
 */
import { createToolDefinition } from '../utils/toolRegistration';
import { toolDefinitions } from './toolDefinitions';

// 介面定義
export interface ListToolsResult {
  tools: string[];
}

/**
 * 列出所有可用工具
 * @returns 工具名稱列表
 */
export const listToolsImpl = async (): Promise<ListToolsResult> => {
  // 返回所有可用工具的列表
  return {
    tools: toolDefinitions.map(tool => tool.name)
  };
};

// 定義工具輸入模式 (空物件，因為不需要參數)
const listToolsSchema = {
  type: 'object',
  properties: {},
  required: []
};

// 建立標準化工具定義
export const listTools = createToolDefinition(
  'listTools',
  '列出所有可用的工具及其描述',
  listToolsSchema,
  listToolsImpl
);
