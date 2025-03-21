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
 * @param context 錯誤上下文，用於提供更詳細的錯誤信息
 * @returns 標準化的 MCP 錯誤
 */
export function toMcpError(error: unknown, context?: string): McpError {
  if (error instanceof McpError) {
    return error;
  }
  
  // 根據錯誤消息判斷錯誤類型
  if (error instanceof Error) {
    const errorMessage = context ? `${context}: ${error.message}` : error.message;
    
    if (error.message.includes('not found') || error.message.includes('找不到')) {
      return new McpError(ErrorCode.InvalidRequest, errorMessage); // 找不到資源
    } else if (error.message.includes('invalid') || error.message.includes('無效') || 
               error.message.includes('缺少必要參數') || error.message.includes('不能為空')) {
      return new McpError(ErrorCode.InvalidParams, errorMessage); // 參數無效
    } else if (error.message.includes('permission') || error.message.includes('權限')) {
      return new McpError(ErrorCode.MethodNotFound, errorMessage); // 權限問題
    } else if (error.message.includes('conflict') || error.message.includes('衝突')) {
      return new McpError(ErrorCode.InvalidRequest, errorMessage); // 資源衝突
    } else {
      return new McpError(ErrorCode.InternalError, errorMessage); // 內部錯誤
    }
  }
  
  // 處理非 Error 類型的錯誤
  const errorMessage = context 
    ? `${context}: ${typeof error === 'string' ? error : '未知錯誤'}`
    : (typeof error === 'string' ? error : '未知錯誤');
  
  return new McpError(
    ErrorCode.InternalError,
    errorMessage
  );
}

/**
 * 標準化工具包裝器
 * 將工具函數包裝在標準化的錯誤處理中，確保所有參數驗證和錯誤回應一致
 * 
 * @param handler 工具處理函數
 * @param schema 輸入參數結構定義
 * @param toolName 工具名稱，用於錯誤上下文
 * @returns 包裝後的函數
 */
export function standardizeToolExecution<T, R>(
  handler: (params: T) => Promise<R>,
  schema: any,
  toolName?: string
): (params: T) => Promise<R> {
  return async (params: T): Promise<R> => {
    try {
      // 參數驗證
      validateParams(params, schema);
      
      // 執行工具邏輯
      return await handler(params);
    } catch (error) {
      // 標準化錯誤處理
      const context = toolName ? `執行工具 ${toolName} 時` : undefined;
      
      if (error instanceof McpError) {
        // 已經是 MCP 錯誤，直接拋出
        throw error;
      } else if (error instanceof Error) {
        // 將一般錯誤轉換為 MCP 錯誤
        console.error(`${context || '工具執行'}錯誤:`, error);
        throw toMcpError(error, context);
      } else {
        // 未知錯誤類型
        console.error(`${context || '工具執行'}中的未知錯誤:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          context ? `${context}發生未知錯誤` : '執行過程中發生未知錯誤'
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
      throw toMcpError(error, context ? `參數驗證 (${context})` : '參數驗證');
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
  const missingParams = requiredParams.filter(param => {
    // 檢查參數是否存在且不為空
    return params[param] === undefined || params[param] === null || params[param] === '';
  });
  
  if (missingParams.length > 0) {
    const context = toolName ? `在 ${toolName} 中` : '';
    const message = `缺少必要參數或參數為空: ${missingParams.join(', ')} ${context}`;
    throw new McpError(ErrorCode.InvalidParams, message);
  }
}

/**
 * 將業務邏輯錯誤轉換為標準化錯誤
 * 
 * @param message 錯誤訊息
 * @param code 錯誤代碼，預設為 InvalidRequest
 * @param context 錯誤上下文
 */
export function throwBusinessError(
  message: string, 
  code: ErrorCode = ErrorCode.InvalidRequest,
  context?: string
): never {
  const errorMessage = context ? `${context}: ${message}` : message;
  console.error(`業務邏輯錯誤: ${errorMessage}`);
  throw new McpError(code, errorMessage);
}

/**
 * 拋出標準化的資源不存在錯誤
 * 
 * @param id 資源 ID
 * @param resourceType 資源類型名稱
 * @param additionalInfo 額外的錯誤信息
 */
export function throwResourceNotFound(
  id: string, 
  resourceType: string,
  additionalInfo?: string
): never {
  const message = additionalInfo 
    ? `找不到${resourceType}: ${id} (${additionalInfo})`
    : `找不到${resourceType}: ${id}`;
  console.error(message);
  throw new McpError(ErrorCode.InvalidParams, message);
}

/**
 * 拋出標準化的參數錯誤
 * 
 * @param message 錯誤訊息
 * @param paramName 有問題的參數名稱
 * @param expectedValue 預期的參數值或格式
 * @param actualValue 實際提供的參數值
 */
export function throwParameterError(
  message: string, 
  paramName?: string,
  expectedValue?: any,
  actualValue?: any
): never {
  let fullMessage = paramName ? `參數 ${paramName} 錯誤: ${message}` : message;
  
  if (expectedValue !== undefined && actualValue !== undefined) {
    fullMessage += `，預期: ${expectedValue}，實際: ${actualValue}`;
  } else if (expectedValue !== undefined) {
    fullMessage += `，預期: ${expectedValue}`;
  } else if (actualValue !== undefined) {
    fullMessage += `，實際: ${actualValue}`;
  }
  
  console.error(`參數錯誤: ${fullMessage}`);
  throw new McpError(ErrorCode.InvalidParams, fullMessage);
}

/**
 * 拋出標準化的資源衝突錯誤
 * 
 * @param message 錯誤訊息
 * @param resourceType 資源類型名稱
 * @param resourceId 資源 ID
 */
export function throwResourceConflict(
  message: string,
  resourceType?: string,
  resourceId?: string
): never {
  let fullMessage = message;
  
  if (resourceType && resourceId) {
    fullMessage = `${resourceType} (${resourceId}) ${message}`;
  } else if (resourceType) {
    fullMessage = `${resourceType} ${message}`;
  }
  
  console.error(`資源衝突: ${fullMessage}`);
  throw new McpError(ErrorCode.InvalidRequest, fullMessage);
}

/**
 * 拋出標準化的資料庫錯誤
 * 
 * @param message 錯誤訊息
 * @param operation 資料庫操作類型
 * @param entity 實體類型
 */
export function throwDatabaseError(
  message: string,
  operation?: string,
  entity?: string
): never {
  let fullMessage = message;
  
  if (operation && entity) {
    fullMessage = `${operation} ${entity} 時發生錯誤: ${message}`;
  } else if (operation) {
    fullMessage = `${operation} 時發生錯誤: ${message}`;
  }
  
  console.error(`資料庫錯誤: ${fullMessage}`);
  throw new McpError(ErrorCode.InternalError, fullMessage);
}

/**
 * 拋出標準化的格式錯誤
 * 
 * @param message 錯誤訊息
 * @param paramName 有問題的參數名稱
 * @param expectedFormat 預期的格式
 */
export function throwFormatError(
  message: string,
  paramName?: string,
  expectedFormat?: string
): never {
  let fullMessage = paramName ? `參數 ${paramName} 格式錯誤: ${message}` : `格式錯誤: ${message}`;
  
  if (expectedFormat) {
    fullMessage += `，預期格式: ${expectedFormat}`;
  }
  
  console.error(fullMessage);
  throw new McpError(ErrorCode.InvalidParams, fullMessage);
}