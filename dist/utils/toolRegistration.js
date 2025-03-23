"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToolDefinition = createToolDefinition;
exports.registerToolHandlers = registerToolHandlers;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const enhancedErrorHandling_1 = require("./enhancedErrorHandling");
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
function createToolDefinition(name, description, inputSchema, execute) {
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
function registerToolHandlers(server, tools) {
    if (!tools || tools.length === 0) {
        console.error('警告: 沒有找到任何工具定義可註冊');
        return;
    }
    // 建立工具名稱到工具定義的映射表，方便查詢
    const toolMap = new Map();
    // 記錄重複的工具名稱
    const duplicateNames = new Set();
    // 填充映射表，檢查重複名稱
    for (const tool of tools) {
        if (!tool.name) {
            console.error('警告: 跳過沒有名稱的工具定義');
            continue;
        }
        if (toolMap.has(tool.name)) {
            console.error(`警告: 發現重複的工具名稱: ${tool.name}`);
            duplicateNames.add(tool.name);
            continue;
        }
        toolMap.set(tool.name, tool);
    }
    if (duplicateNames.size > 0) {
        console.error(`警告: 有 ${duplicateNames.size} 個重複的工具名稱: ${Array.from(duplicateNames).join(', ')}`);
    }
    // 設置工具呼叫處理器
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
        const { name, arguments: args = {} } = request.params; // 提供預設空物件
        try {
            // 查找工具定義
            const tool = toolMap.get(name);
            // 工具不存在
            if (!tool) {
                console.error(`警告: 嘗試呼叫不存在的工具: ${name}`);
                throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `找不到名為 "${name}" 的工具`);
            }
            console.error(`執行工具: ${name}`);
            // 驗證參數
            if (tool.inputSchema && tool.inputSchema.required) {
                for (const requiredParam of tool.inputSchema.required) {
                    if (args[requiredParam] === undefined) {
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, `缺少必要參數: ${requiredParam}`);
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
            }
            catch (error) {
                // 轉換錯誤為標準的 MCP 錯誤
                const mcpError = (0, enhancedErrorHandling_1.toMcpError)(error);
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
        }
        catch (error) {
            // 處理工具參數驗證或工具查找時的錯誤
            const mcpError = (0, enhancedErrorHandling_1.toMcpError)(error);
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
    console.error(`已註冊 ${toolMap.size} 個工具處理器`);
}
