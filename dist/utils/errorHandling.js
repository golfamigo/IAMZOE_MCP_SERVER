"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToMcpError = convertToMcpError;
exports.throwIfNotFound = throwIfNotFound;
exports.throwInvalidParam = throwInvalidParam;
exports.throwBusinessLogicError = throwBusinessLogicError;
exports.throwPermissionDenied = throwPermissionDenied;
exports.throwResourceConflict = throwResourceConflict;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
/**
 * MCP 錯誤類型轉換函數
 * 將任何錯誤轉換為標準的 MCP 錯誤
 */
function convertToMcpError(error) {
    if (error instanceof types_js_1.McpError) {
        return error;
    }
    if (error instanceof Error) {
        // 判斷錯誤類型並轉換為對應的 MCP 錯誤
        if (error.message.includes('not found') || error.message.includes('找不到')) {
            return new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, error.message); // 找不到資源
        }
        else if (error.message.includes('invalid') || error.message.includes('無效')) {
            return new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, error.message);
        }
        else if (error.message.includes('permission') || error.message.includes('權限')) {
            return new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, error.message); // 權限問題
        }
        else if (error.message.includes('conflict') || error.message.includes('衝突')) {
            return new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, error.message); // 資源衝突
        }
        else {
            return new types_js_1.McpError(types_js_1.ErrorCode.InternalError, error.message);
        }
    }
    return new types_js_1.McpError(types_js_1.ErrorCode.InternalError, '發生未知錯誤');
}
/**
 * 拋出「找不到資源」錯誤
 * @param id 資源 ID
 * @param resourceType 資源類型名稱
 */
function throwIfNotFound(id, resourceType) {
    const message = id
        ? `找不到${resourceType}: ${id}`
        : `找不到${resourceType}`;
    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, message); // 找不到資源
}
/**
 * 拋出無效參數錯誤
 * @param message 錯誤訊息
 */
function throwInvalidParam(message) {
    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, message);
}
/**
 * 拋出業務邏輯錯誤
 * @param message 錯誤訊息
 */
function throwBusinessLogicError(message) {
    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, message);
}
/**
 * 拋出權限拒絕錯誤
 * @param message 錯誤訊息
 */
function throwPermissionDenied(message) {
    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, message); // 權限被拒
}
/**
 * 拋出資源衝突錯誤
 * @param message 錯誤訊息
 */
function throwResourceConflict(message) {
    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, message); // 資源衝突
}
