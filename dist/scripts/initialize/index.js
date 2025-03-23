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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 初始化腳本
 * 執行系統需要的一次性任務，包括：
 * 1. 初始化資料庫 (創建索引和約束)
 * 2. 生成工具定義
 * 3. 生成工具文檔
 *
 * 使用方式: npm run initialize
 */
const path = __importStar(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../../db");
const databaseSetup_1 = require("../../utils/databaseSetup");
const toolScanner_1 = require("../../utils/toolScanner");
const toolScanner_2 = require("../../utils/toolScanner");
const fs = __importStar(require("fs/promises"));
// 載入環境變數
const envPath = path.resolve(__dirname, '../../../.env');
console.log(`嘗試載入環境變數文件: ${envPath}`);
const envResult = dotenv_1.default.config({ path: envPath });
if (envResult.error) {
    console.error('載入環境變數失敗:', envResult.error);
}
else {
    console.log('環境變數載入成功');
}
// 工具目錄和輸出路徑設定
const TOOLS_DIR = path.join(__dirname, '../../tools');
const TOOL_DEFS_OUTPUT = path.join(__dirname, '../../tools/generatedToolDefs.ts');
const DOCS_DIR = path.join(__dirname, '../../../docs');
const DOCS_OUTPUT = path.join(DOCS_DIR, 'Tools-Usage-Guide.md');
/**
 * 生成工具文檔
 */
async function generateToolDocumentation() {
    try {
        console.log('開始生成工具文檔...');
        // 確保文檔目錄存在
        try {
            await fs.mkdir(DOCS_DIR, { recursive: true });
        }
        catch (err) {
            // 目錄可能已經存在，忽略錯誤
        }
        // 掃描工具定義
        const tools = await (0, toolScanner_2.scanToolDefinitions)(TOOLS_DIR);
        if (tools.length === 0) {
            console.warn('警告: 沒有找到任何工具定義');
            return;
        }
        console.log(`找到 ${tools.length} 個工具定義`);
        // 開始生成文檔內容
        let docContent = `# IAMZOE MCP 伺服器工具使用指南

此文檔自動生成於 ${new Date().toISOString()}

## 目錄

`;
        // 生成目錄
        tools.forEach((tool, index) => {
            docContent += `${index + 1}. [${tool.name}](#${tool.name.toLowerCase()}) - ${tool.description}\n`;
        });
        docContent += `\n## 工具詳細說明\n\n`;
        // 生成每個工具的詳細說明
        tools.forEach(tool => {
            docContent += `### ${tool.name}\n\n`;
            docContent += `**描述:** ${tool.description}\n\n`;
            if (tool.inputSchema) {
                docContent += `**輸入參數:**\n\n`;
                // 如果有參數說明
                if (tool.inputSchema.properties && Object.keys(tool.inputSchema.properties).length > 0) {
                    docContent += `| 參數名稱 | 類型 | 必填 | 說明 |\n`;
                    docContent += `| -------- | ---- | ---- | ---- |\n`;
                    const properties = tool.inputSchema.properties;
                    const required = tool.inputSchema.required || [];
                    for (const [paramName, paramDef] of Object.entries(properties)) {
                        const paramInfo = paramDef;
                        const paramType = paramInfo.enum
                            ? `${paramInfo.type} (${paramInfo.enum.join(', ')})`
                            : paramInfo.type;
                        const isRequired = required.includes(paramName) ? '是' : '否';
                        const description = paramInfo.description || '';
                        docContent += `| \`${paramName}\` | ${paramType} | ${isRequired} | ${description} |\n`;
                    }
                }
                else {
                    docContent += `無參數\n\n`;
                }
            }
            docContent += `\n**示例:**\n\n`;
            docContent += `\`\`\`json\n{
  "name": "${tool.name}",
  "arguments": ${generateSampleArguments(tool.inputSchema)}
}\n\`\`\`\n\n`;
            docContent += `**注意事項:**\n`;
            // 添加錯誤處理和注意事項
            const requiredParams = tool.inputSchema?.required || [];
            if (requiredParams.length > 0) {
                docContent += `- 必須提供參數: ${requiredParams.map(p => `\`${p}\``).join(', ')}\n`;
            }
            // 添加潛在錯誤說明
            docContent += `- 可能的錯誤代碼:\n`;
            docContent += `  - \`InvalidParams\`: 當提供的參數不完整或格式錯誤\n`;
            docContent += `  - \`MethodNotFound\`: 當呼叫不存在的工具\n`;
            docContent += `  - \`InternalError\`: 當工具執行過程中發生內部錯誤\n`;
            docContent += `  - \`BusinessLogicError\`: 當違反業務邏輯規則\n`;
            docContent += `\n---\n\n`;
        });
        // 添加附加信息
        docContent += `## 附錄

### 錯誤處理

所有工具都支持標準化的錯誤處理，當工具執行失敗時，將返回以下格式的錯誤:

\`\`\`json
{
  "content": [
    {
      "type": "text",
      "text": "錯誤訊息"
    }
  ],
  "isError": true
}
\`\`\`

### 常見錯誤代碼

- \`InvalidParams\`: 當提供的參數不完整或格式錯誤
- \`MethodNotFound\`: 當呼叫不存在的工具
- \`InternalError\`: 當工具執行過程中發生內部錯誤
- \`BusinessLogicError\`: 當違反業務邏輯規則
- \`NotFoundError\`: 當請求的資源找不到
- \`AuthenticationError\`: 當認證失敗
- \`AuthorizationError\`: 當用戶沒有足夠權限

### 類型說明

- 所有 ID 字段應為 UUID 格式字符串
- 日期和時間應使用 ISO 8601 格式 (YYYY-MM-DDTHH:MM:SS.sssZ)
- 布爾值應使用 true 或 false
`;
        // 寫入文檔
        await fs.writeFile(DOCS_OUTPUT, docContent, 'utf-8');
        console.log(`工具文檔已生成: ${DOCS_OUTPUT}`);
    }
    catch (error) {
        console.error('生成工具文檔時發生錯誤:', error);
    }
}
/**
 * 為工具輸入參數生成示例值
 * @param schema 參數結構描述
 * @returns 示例參數 JSON 字符串
 */
function generateSampleArguments(schema) {
    if (!schema || !schema.properties) {
        return "{}";
    }
    const sampleArgs = {};
    for (const [paramName, paramDef] of Object.entries(schema.properties)) {
        const paramInfo = paramDef;
        // 根據類型生成示例值
        switch (paramInfo.type) {
            case 'string':
                if (paramInfo.enum && paramInfo.enum.length > 0) {
                    sampleArgs[paramName] = paramInfo.enum[0];
                }
                else if (paramName.includes('id')) {
                    sampleArgs[paramName] = "00000000-0000-0000-0000-000000000000";
                }
                else if (paramName.includes('date')) {
                    sampleArgs[paramName] = "2025-01-01";
                }
                else if (paramName.includes('time')) {
                    sampleArgs[paramName] = "2025-01-01T12:00:00Z";
                }
                else if (paramName.includes('url')) {
                    sampleArgs[paramName] = "https://example.com/sample";
                }
                else if (paramName.includes('email')) {
                    sampleArgs[paramName] = "user@example.com";
                }
                else if (paramName.includes('phone')) {
                    sampleArgs[paramName] = "+123456789";
                }
                else {
                    sampleArgs[paramName] = "範例文字";
                }
                break;
            case 'number':
            case 'integer':
                if (paramName.includes('amount') || paramName.includes('price') || paramName.includes('budget')) {
                    sampleArgs[paramName] = 100.00;
                }
                else {
                    sampleArgs[paramName] = 1;
                }
                break;
            case 'boolean':
                sampleArgs[paramName] = true;
                break;
            case 'array':
                sampleArgs[paramName] = [];
                break;
            case 'object':
                sampleArgs[paramName] = {};
                break;
            default:
                sampleArgs[paramName] = null;
        }
    }
    return JSON.stringify(sampleArgs, null, 2);
}
/**
 * 主初始化程序
 */
async function initialize() {
    console.log("開始系統初始化...");
    // 檢查環境變數是否已正確設置
    console.log('檢查環境變數:');
    console.log('NEO4J_URI:', process.env.NEO4J_URI ? '已設置' : '未設置');
    console.log('NEO4J_USERNAME:', process.env.NEO4J_USERNAME ? '已設置' : '未設置');
    console.log('NEO4J_PASSWORD:', process.env.NEO4J_PASSWORD ? '已設置' : '未設置');
    if (!process.env.NEO4J_URI || !process.env.NEO4J_USERNAME || !process.env.NEO4J_PASSWORD) {
        console.error('錯誤: 環境變數未正確設置。請確保 .env 文件包含所需的 Neo4j 連接信息。');
        process.exit(1);
    }
    try {
        // 1. 連接資料庫
        await db_1.neo4jClient.connect();
        console.log('已連接到 Neo4j 資料庫');
        // 2. 初始化資料庫 (創建索引和約束)
        await (0, databaseSetup_1.initializeDatabase)();
        console.log('資料庫初始化完成');
        // 3. 生成工具定義
        console.log('開始生成工具定義...');
        console.log(`工具目錄: ${TOOLS_DIR}`);
        console.log(`輸出檔案: ${TOOL_DEFS_OUTPUT}`);
        await (0, toolScanner_1.generateToolDefinitionsTemplate)(TOOL_DEFS_OUTPUT, TOOLS_DIR);
        console.log('工具定義生成完成');
        // 4. 生成工具文檔
        await generateToolDocumentation();
        console.log('系統初始化完成');
        process.exit(0);
    }
    catch (error) {
        console.error('初始化過程中發生錯誤:', error);
        process.exit(1);
    }
    finally {
        // 關閉資料庫連線
        try {
            await db_1.neo4jClient.close();
        }
        catch (error) {
            console.error('關閉資料庫連線時發生錯誤:', error);
        }
    }
}
// 執行初始化
initialize();
