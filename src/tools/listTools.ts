import { toolNames } from './index';

// 接口定義
export interface ListToolsResult {
  tools: string[];
}

// listTools 工具實現
export const listTools = async (): Promise<ListToolsResult> => {
  // 返回所有可用工具的列表
  return {
    tools: toolNames
  };
};
