"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listToolsTool = exports.toolDefinitions = void 0;
exports.initializeToolDefinitions = initializeToolDefinitions;
exports.loadToolDefinitions = loadToolDefinitions;
const toolScanner_1 = require("../utils/toolScanner");
const path = __importStar(require("path"));
const toolRegistration_1 = require("../utils/toolRegistration");
const generatedToolDefs_1 = require("./generatedToolDefs");
// 工具目錄路徑
const TOOLS_DIR = path.join(__dirname);
// 暫時空陣列，將在初始化時填充
let _toolDefinitions = [];
/**
 * 初始化工具定義
 * 掃描工具目錄，收集所有符合標準的工具定義
 */
async function initializeToolDefinitions() {
    try {
        console.error('開始初始化工具定義...');
        // 掃描工具目錄，收集所有工具定義
        const tools = await (0, toolScanner_1.scanToolDefinitions)(TOOLS_DIR);
        // 檢查是否有工具實作但沒有定義
        await (0, toolScanner_1.checkToolCoverage)(TOOLS_DIR, tools);
        // 更新工具定義陣列
        _toolDefinitions = tools;
        console.error(`成功初始化 ${_toolDefinitions.length} 個工具定義`);
        return _toolDefinitions;
    }
    catch (error) {
        console.error('初始化工具定義時發生錯誤:', error);
        throw error;
    }
}
// 用於外部存取的工具定義陣列
exports.toolDefinitions = [];
// 定義「列出工具」的工具
// 為工具列表工具手動建立標準化定義
exports.listToolsTool = (0, toolRegistration_1.createToolDefinition)('listTools', '列出所有可用的工具及其描述', {
    type: 'object',
    properties: {},
    required: []
}, async () => {
    // 返回所有工具名稱和描述
    return {
        tools: exports.toolDefinitions.map(tool => ({
            name: tool.name,
            description: tool.description
        }))
    };
});
/**
 * 初始化並填充工具定義陣列
 * 這個函數應該在應用程式啟動時被呼叫
 */
async function loadToolDefinitions() {
    const definedTools = await initializeToolDefinitions();
    // 清空現有陣列
    exports.toolDefinitions.splice(0, exports.toolDefinitions.length);
    // 添加列出工具的工具
    exports.toolDefinitions.push(exports.listToolsTool);
    // 添加所有掃描到的工具
    definedTools.forEach(tool => {
        // 避免重複添加 listTools
        if (tool.name !== 'listTools') {
            exports.toolDefinitions.push(tool);
        }
    });
    // 添加手動生成的工具定義
    console.error(`添加 ${generatedToolDefs_1.generatedToolDefinitions.length} 個手動生成的工具定義`);
    const existingToolNames = new Set(exports.toolDefinitions.map(tool => tool.name));
    generatedToolDefs_1.generatedToolDefinitions.forEach(tool => {
        // 避免重複添加工具
        if (!existingToolNames.has(tool.name)) {
            exports.toolDefinitions.push(tool);
            existingToolNames.add(tool.name);
        }
    });
    console.error(`工具定義載入完成，共 ${exports.toolDefinitions.length} 個工具可用`);
    return exports.toolDefinitions;
}
