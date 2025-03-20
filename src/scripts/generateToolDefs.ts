/**
 * 工具定義生成腳本
 * 此腳本會掃描 src/tools 目錄下的所有工具檔案，並生成工具定義範本
 * 使用方式：
 *   npm run generate-tools 或 ts-node src/scripts/generateToolDefs.ts
 */
import path from 'path';
import { generateToolDefinitionsTemplate } from '../utils/toolScanner';

// 掃描工具目錄
const toolsDir = path.join(__dirname, '..', 'tools');
const outputFile = path.join(__dirname, '..', 'tools', 'generatedToolDefs.ts');

console.log('開始生成工具定義...');
console.log(`工具目錄: ${toolsDir}`);
console.log(`輸出檔案: ${outputFile}`);

// 生成工具定義範本
generateToolDefinitionsTemplate(outputFile, toolsDir)
  .then(() => {
    console.log('工具定義生成完成！');
    console.log('請手動檢查並修改 generatedToolDefs.ts 檔案，然後合併到 toolDefinitions.ts');
  })
  .catch(error => {
    console.error('生成工具定義時發生錯誤:', error);
    process.exit(1);
  });