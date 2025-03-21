/**
 * 增強型錯誤處理
 * 標準化所有工具的錯誤處理和參數驗證，確保一致的錯誤回應格式
 */
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { validateParams } from '../types/tool';

/**
 * 將各種錯誤轉換為標準的 MCP 錯誤
 * 
 * @param error 原始錯誤
 * @returns 標準化的 MCP 錯誤
 */
export function toMcpError(error: unknown): McpError {
  if (error instanceof McpError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new McpError(
      ErrorCode.InternalError,
      error.message
    );
  }
  
  return new McpError(
    ErrorCode.InternalError,
    typeof error === 'string' ? error : '未知錯誤'
  );
}

/**
 * 標準化工具包裝器
 * 將工具函數包裝在標準化的錯誤處理中，確保所有參數驗證和錯誤回應一致
 * 
 * @param handler 工具處理函數
 * @param schema 輸入參數結構定義
 * @returns 包裝後的函數
 */
export function standardizeToolExecution<T, R>(
  handler: (params: T) => Promise<R>,
  schema: any
): (params: T) => Promise<R> {
  return async (params: T): Promise<R> => {
    try {
      // 參數驗證
      validateParams(params, schema);
      
      // 執行工具邏輯
      return await handler(params);
    } catch (error) {
      // 標準化錯誤處理
      if (error instanceof McpError) {
        // 已經是 MCP 錯誤，直接拋出
        throw error;
      } else if (error instanceof Error) {
        // 將一般錯誤轉換為 MCP 錯誤
        console.error('工具執行錯誤:', error);
        throw new McpError(
          ErrorCode.InternalError,
          `執行錯誤: ${error.message}`
        );
      } else {
        // 未知錯誤類型
        console.error('未知錯誤:', error);
        throw new McpError(
          ErrorCode.InternalError,
          '執行過程中發生未知錯誤'
        );
      }
    }
  };
}

/**
 * 參數驗證工具
 * 檢查參數是否符合 JSON Schema，若不符合則拋出標準化的錯誤
 * 
 * @param params 輸入參數
 * @param schema 參數結構定義
 * @param context 驗證上下文
 */
export function validateToolParams(params: any, schema: any, context?: string): void {
  try {
    validateParams(params, schema);
  } catch (error) {
    console.error(`參數驗證錯誤 ${context ? '(' + context + ')' : ''}:`, error);
    
    if (error instanceof McpError) {
      throw error;
    } else {
      throw new McpError(
        ErrorCode.InvalidParams,
        error instanceof Error ? error.message : '參數驗證失敗'
      );
    }
  }
}

/**
 * 檢查必要參數存在
 * 檢查輸入參數中是否包含所有必要參數，若不符合則拋出錯誤
 * 
 * @param params 輸入參數
 * @param requiredParams 必要參數名稱陣列
 * @param toolName 工具名稱，用於錯誤訊息
 */
export function checkRequiredParams(params: any, requiredParams: string[], toolName?: string): void {
  const missingParams = requiredParams.filter(param => params[param] === undefined);
  
  if (missingParams.length > 0) {
    const context = toolName ? `在 ${toolName} 中` : '';
    const message = `缺少必要參數: ${missingParams.join(', ')} ${context}`;
    throw new McpError(ErrorCode.InvalidParams, message);
  }
}

/**
 * 將業務邏輯錯誤轉換為標準化錯誤
 * 
 * @param message 錯誤訊息
 * @param code 錯誤代碼，預設為 InternalError
 */
export function throwBusinessError(message: string, code: ErrorCode = ErrorCode.InternalError): never {
  console.error(`業務邏輯錯誤: ${message}`);
  throw new McpError(code, message);
}

/**
 * 拋出標準化的資源不存在錯誤
 * 
 * @param id 資源 ID
 * @param resourceType 資源類型名稱
 */
export function throwResourceNotFound(id: string, resourceType: string): never {
  const message = `找不到${resourceType}: ${id}`;
  console.error(message);
  throw new McpError(ErrorCode.InvalidParams, message);
}

/**
 * 拋出標準化的參數錯誤
 * 
 * @param message 錯誤訊息
 * @param paramName 有問題的參數名稱
 */
export function throwParameterError(message: string, paramName?: string): never {
  const fullMessage = paramName ? `參數 ${paramName} 錯誤: ${message}` : message;
  console.error(`參數錯誤: ${fullMessage}`);
  throw new McpError(ErrorCode.InvalidParams, fullMessage);
}