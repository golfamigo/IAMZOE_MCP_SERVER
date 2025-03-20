import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP 錯誤類型轉換函數
 * 將任何錯誤轉換為標準的 MCP 錯誤
 */
export function convertToMcpError(error: unknown): McpError {
  if (error instanceof McpError) {
    return error;
  }
  
  if (error instanceof Error) {
    // 判斷錯誤類型並轉換為對應的 MCP 錯誤
    if (error.message.includes('not found') || error.message.includes('找不到')) {
      return new McpError(ErrorCode.InvalidRequest, error.message); // 找不到資源
    } else if (error.message.includes('invalid') || error.message.includes('無效')) {
      return new McpError(ErrorCode.InvalidParams, error.message);
    } else if (error.message.includes('permission') || error.message.includes('權限')) {
      return new McpError(ErrorCode.MethodNotFound, error.message); // 權限問題
    } else if (error.message.includes('conflict') || error.message.includes('衝突')) {
      return new McpError(ErrorCode.InvalidRequest, error.message); // 資源衝突
    } else {
      return new McpError(ErrorCode.InternalError, error.message);
    }
  }
  
  return new McpError(
    ErrorCode.InternalError,
    '發生未知錯誤'
  );
}

/**
 * 拋出「找不到資源」錯誤
 * @param id 資源 ID
 * @param resourceType 資源類型名稱
 */
export function throwIfNotFound(id: string | null, resourceType: string): never {
  const message = id 
    ? `找不到${resourceType}: ${id}` 
    : `找不到${resourceType}`;
    
  throw new McpError(ErrorCode.InvalidRequest, message); // 找不到資源
}

/**
 * 拋出無效參數錯誤
 * @param message 錯誤訊息
 */
export function throwInvalidParam(message: string): never {
  throw new McpError(ErrorCode.InvalidParams, message);
}

/**
 * 拋出業務邏輯錯誤
 * @param message 錯誤訊息
 */
export function throwBusinessLogicError(message: string): never {
  throw new McpError(ErrorCode.InvalidRequest, message);
}

/**
 * 拋出權限拒絕錯誤
 * @param message 錯誤訊息
 */
export function throwPermissionDenied(message: string): never {
  throw new McpError(ErrorCode.MethodNotFound, message); // 權限被拒
}

/**
 * 拋出資源衝突錯誤
 * @param message 錯誤訊息
 */
export function throwResourceConflict(message: string): never {
  throw new McpError(ErrorCode.InvalidRequest, message); // 資源衝突
}