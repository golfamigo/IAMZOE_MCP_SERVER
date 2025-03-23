"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTools = exports.listToolsImpl = void 0;
/**
 * 工具列表工具
 * 提供列出所有可用工具的功能
 */
const toolRegistration_1 = require("../utils/toolRegistration");
const toolDefinitions_1 = require("./toolDefinitions");
/**
 * 列出所有可用工具
 * @returns 工具名稱列表
 */
const listToolsImpl = async () => {
    // 返回所有可用工具的列表
    return {
        tools: toolDefinitions_1.toolDefinitions.map(tool => tool.name)
    };
};
exports.listToolsImpl = listToolsImpl;
// 定義工具輸入模式 (空物件，因為不需要參數)
const listToolsSchema = {
    type: 'object',
    properties: {},
    required: []
};
// 建立標準化工具定義
exports.listTools = (0, toolRegistration_1.createToolDefinition)('listTools', '列出所有可用的工具及其描述', listToolsSchema, exports.listToolsImpl);
