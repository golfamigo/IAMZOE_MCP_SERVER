"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 工具定義生成腳本
 * 此腳本會掃描 src/tools 目錄下的所有工具檔案，並生成工具定義範本
 * 使用方式：
 *   npm run generate-tools 或 ts-node src/scripts/generateToolDefs.ts
 */
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const toolScanner_1 = require("../utils/toolScanner");
// 掃描工具目錄
const toolsDir = path_1.default.join(__dirname, '..', 'tools');
const outputFile = path_1.default.join(__dirname, '..', 'tools', 'generatedToolDefs.ts');
const toolDefinitionsFile = path_1.default.join(__dirname, '..', 'tools', 'toolDefinitions.ts');
console.error('開始生成工具定義...');
console.error(`工具目錄: ${toolsDir}`);
console.error(`輸出檔案: ${outputFile}`);
// 生成工具定義範本
(0, toolScanner_1.generateToolDefinitionsTemplate)(outputFile, toolsDir)
    .then(async () => {
    console.error('工具定義生成完成！');
    // 自動將生成的工具定義合併到 toolDefinitions.ts 中
    try {
        // 讀取 toolDefinitions.ts 檔案
        const toolDefinitionsContent = await promises_1.default.readFile(toolDefinitionsFile, 'utf-8');
        // 檢查是否已經引入 generatedToolDefinitions
        if (!toolDefinitionsContent.includes('import { generatedToolDefinitions }')) {
            // 如果沒有引入，則添加引入語句
            const updatedContent = toolDefinitionsContent.replace('import { createToolDefinition } from \'../utils/toolRegistration\';', 'import { createToolDefinition } from \'../utils/toolRegistration\';\nimport { generatedToolDefinitions } from \'./generatedToolDefs\';');
            // 寫入更新後的內容
            await promises_1.default.writeFile(toolDefinitionsFile, updatedContent, 'utf-8');
            console.error('已自動添加 generatedToolDefinitions 引入語句到 toolDefinitions.ts');
        }
        // 檢查是否已經添加 generatedToolDefinitions 到 toolDefinitions 陣列
        if (!toolDefinitionsContent.includes('generatedToolDefinitions.forEach')) {
            // 如果沒有添加，則添加合併代碼
            const loadToolDefinitionsMatch = toolDefinitionsContent.match(/export async function loadToolDefinitions\(\)[\s\S]*?return toolDefinitions;[\s\S]*?\}/);
            if (loadToolDefinitionsMatch) {
                const loadToolDefinitionsFunc = loadToolDefinitionsMatch[0];
                const updatedFunc = loadToolDefinitionsFunc.replace('console.error(`工具定義載入完成，共 ${toolDefinitions.length} 個工具可用`);', `// 添加手動生成的工具定義
console.error(\`添加 \${generatedToolDefinitions.length} 個手動生成的工具定義\`);
const existingToolNames = new Set(toolDefinitions.map(tool => tool.name));

generatedToolDefinitions.forEach(tool => {
  // 避免重複添加工具
  if (!existingToolNames.has(tool.name)) {
    toolDefinitions.push(tool);
    existingToolNames.add(tool.name);
  }
});

console.error(\`工具定義載入完成，共 \${toolDefinitions.length} 個工具可用\`);`);
                const updatedContent = toolDefinitionsContent.replace(loadToolDefinitionsFunc, updatedFunc);
                // 寫入更新後的內容
                await promises_1.default.writeFile(toolDefinitionsFile, updatedContent, 'utf-8');
                console.error('已自動添加 generatedToolDefinitions 合併代碼到 toolDefinitions.ts');
            }
            else {
                console.error('警告: 無法找到 loadToolDefinitions 函數，請手動合併 generatedToolDefinitions 到 toolDefinitions.ts');
            }
        }
        console.error('工具定義已自動合併到 toolDefinitions.ts');
    }
    catch (error) {
        console.error('合併工具定義時發生錯誤:', error);
        console.error('請手動檢查並修改 generatedToolDefs.ts 檔案，然後合併到 toolDefinitions.ts');
    }
})
    .catch(error => {
    console.error('生成工具定義時發生錯誤:', error);
    process.exit(1);
});
