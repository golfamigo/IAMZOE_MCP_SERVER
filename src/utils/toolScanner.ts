/**
 * 工具掃描器
 * 自動掃描指定目錄，收集所有工具定義
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { ToolDefinition } from '../types/tool';

/**
 * 掃描目錄中的所有工具定義
 * 
 * @param toolsDir 工具所在目錄的路徑
 * @returns 收集到的工具定義陣列
 */
export async function scanToolDefinitions(toolsDir: string): Promise<ToolDefinition[]> {
  try {
    console.log(`開始掃描工具目錄: ${toolsDir}`);
    
    // 讀取工具目錄中的所有檔案
    const files = await fs.readdir(toolsDir, { withFileTypes: true });
    
    // 收集工具定義的陣列
    const toolDefinitions: ToolDefinition[] = [];
    
    // 排除的檔案名稱
    const excludeFiles = ['index.ts', 'toolDefinitions.ts', 'generatedToolDefs.ts'];
    
    // 處理每個檔案
    for (const file of files) {
      // 只處理 .ts 檔案且不是索引檔或當前檔案
      if (file.isFile() && file.name.endsWith('.ts') && !excludeFiles.includes(file.name)) {
        const toolFilePath = path.join(toolsDir, file.name);
        
        try {
          console.log(`嘗試載入工具檔案: ${file.name}`);
          
          // 嘗試匯入工具檔案
          const toolModule = await import(toolFilePath);
          
          // 搜尋檔案中所有可能的工具定義
          // (大多數工具檔案會匯出單一工具或多個工具)
          const potentialTools = Object.values(toolModule).filter(value => 
            value && 
            typeof value === 'object' && 
            'name' in value && 
            'description' in value && 
            'inputSchema' in value && 
            'execute' in value
          ) as ToolDefinition[];
          
          if (potentialTools.length > 0) {
            console.log(`在 ${file.name} 中找到 ${potentialTools.length} 個工具定義`);
            toolDefinitions.push(...potentialTools);
          } else {
            console.warn(`警告: 在 ${file.name} 中沒有找到符合格式的工具定義`);
          }
        } catch (error) {
          console.error(`無法載入工具檔案 ${file.name}:`, error);
        }
      }
    }
    
    console.log(`掃描完成，共發現 ${toolDefinitions.length} 個工具定義`);
    return toolDefinitions;
  } catch (error) {
    console.error('掃描工具定義時發生錯誤:', error);
    throw error;
  }
}

/**
 * 檢查工具覆蓋率
 * 檢查是否有實作但沒有正確定義的工具
 * 
 * @param toolsDir 工具目錄路徑
 * @param definedTools 已定義的工具列表
 */
export async function checkToolCoverage(toolsDir: string, definedTools: ToolDefinition[]): Promise<void> {
  try {
    console.log('開始檢查工具覆蓋率...');
    
    // 取得工具檔案列表
    const files = await fs.readdir(toolsDir, { withFileTypes: true });
    
    // 排除的檔案名稱
    const excludeFiles = ['index.ts', 'toolDefinitions.ts', 'generatedToolDefs.ts'];
    
    // 已定義工具的名稱集合
    const definedToolNames = new Set(definedTools.map(tool => tool.name));
    
    // 檢查每個工具檔案
    for (const file of files) {
      if (file.isFile() && file.name.endsWith('.ts') && !excludeFiles.includes(file.name)) {
        // 檢查檔案內容
        const content = await fs.readFile(path.join(toolsDir, file.name), 'utf-8');
        
        // 尋找可能的工具函數
        // 例如: funcName: async (params) => { ... }
        const functionMatches = content.matchAll(/(\w+):\s*async\s*\([^)]*\)\s*=>/g);
        
        for (const match of functionMatches) {
          const possibleToolName = match[1];
          
          // 跳過已知的非工具函數
          if (['execute'].includes(possibleToolName)) {
            continue;
          }
          
          // 檢查該函數名稱是否在已定義的工具列表中
          if (!definedToolNames.has(possibleToolName)) {
            console.warn(`警告: 在 ${file.name} 中發現可能未定義的工具實作: ${possibleToolName}`);
          }
        }
      }
    }
    
    console.log('工具覆蓋率檢查完成');
  } catch (error) {
    console.error('檢查工具覆蓋率時發生錯誤:', error);
  }
}

/**
 * 生成工具定義範本
 * 掃描工具目錄下的所有工具檔案，自動生成標準化的工具定義範本
 * 
 * @param outputFile 輸出檔案路徑
 * @param toolsDir 工具目錄路徑
 */
export async function generateToolDefinitionsTemplate(outputFile: string, toolsDir: string): Promise<void> {
  try {
    console.log(`開始掃描目錄: ${toolsDir} 尋找工具實作...`);
    
    // 取得工具檔案列表
    const files = await fs.readdir(toolsDir, { withFileTypes: true });
    
    // 排除的檔案名稱
    const excludeFiles = ['index.ts', 'toolDefinitions.ts', 'generatedToolDefs.ts'];
    
    // 收集工具函數
    const toolDefinitions: Array<{
      fileName: string;
      toolName: string;
      description?: string;
    }> = [];
    
    // 檢查每個工具檔案
    for (const file of files) {
      if (file.isFile() && file.name.endsWith('.ts') && !excludeFiles.includes(file.name)) {
        // 檢查檔案內容
        const filePath = path.join(toolsDir, file.name);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // 尋找工具函數 - 匹配 export async function 或 export const x = async function
        // 或 xxx: async (params) => { ... }
        const functionMatches = [
          ...content.matchAll(/export\s+async\s+function\s+(\w+)/g),
          ...content.matchAll(/export\s+const\s+(\w+)\s*=\s*async\s+function/g),
          ...content.matchAll(/(\w+):\s*async\s*\([^)]*\)\s*=>/g)
        ];
        
        // 提取註解中的描述
        const descriptionRegex = /\/\*\*\s*\n([^*]|\*[^\/])*\*\/\s*\n[^(]*\([^)]*\)/g;
        const descriptionMatches = content.match(descriptionRegex);
        const descriptions: Map<string, string> = new Map();
        
        if (descriptionMatches) {
          for (const match of descriptionMatches) {
            // 提取函數名稱
            const funcNameMatch = /\n\s*(export\s+)?(async\s+)?function\s+(\w+)|\n\s*(export\s+)?const\s+(\w+)|(\w+):\s*async/i.exec(match);
            if (funcNameMatch) {
              const funcName = funcNameMatch[3] || funcNameMatch[5] || funcNameMatch[6];
              
              // 提取描述
              const descMatch = match.match(/\*\s*([^*@][^\n]*)/);
              if (descMatch && funcName) {
                descriptions.set(funcName, descMatch[1].trim());
              }
            }
          }
        }
        
        // 收集所有找到的工具函數
        for (const match of functionMatches) {
          const toolName = match[1];
          
          // 跳過已知的非工具函數
          if (['execute'].includes(toolName)) {
            continue;
          }
          
          toolDefinitions.push({
            fileName: file.name.replace('.ts', ''),
            toolName,
            description: descriptions.get(toolName) || `${toolName} 工具`
          });
        }
      }
    }
    
    // 生成工具定義檔案內容
    let fileContent = `/**
 * 自動生成的工具定義檔案
 * 生成時間: ${new Date().toISOString()}
 * 
 * 此檔案由 generateToolDefs.ts 腳本自動生成
 * 請手動檢查並確保每個工具定義正確
 */
import { createToolDefinition } from '../utils/toolRegistration';\n\n`;

    // 導入工具函數
    const imports = new Set<string>();
    toolDefinitions.forEach(tool => {
      imports.add(`import { ${tool.toolName} } from './${tool.fileName}';\n`);
    });
    
    imports.forEach(importStmt => {
      fileContent += importStmt;
    });
    
    fileContent += `\n// 工具定義列表\nexport const generatedToolDefinitions = [\n`;
    
    // 添加每個工具的定義
    toolDefinitions.forEach(tool => {
      fileContent += `  // ${tool.fileName} 工具\n`;
      fileContent += `  createToolDefinition(\n`;
      fileContent += `    '${tool.toolName}',\n`;
      fileContent += `    '${tool.description}',\n`;
      fileContent += `    {\n`;
      fileContent += `      type: 'object',\n`;
      fileContent += `      properties: {\n`;
      fileContent += `        // TODO: 添加參數定義\n`;
      fileContent += `      },\n`;
      fileContent += `      required: [/* TODO: 添加必要參數 */]\n`;
      fileContent += `    },\n`;
      fileContent += `    ${tool.toolName}\n`;
      fileContent += `  ),\n\n`;
    });
    
    fileContent += `];\n`;
    
    // 寫入檔案
    await fs.writeFile(outputFile, fileContent, 'utf-8');
    console.log(`已生成工具定義範本至: ${outputFile}`);
    console.log(`共找到 ${toolDefinitions.length} 個工具函數`);

    // 提示信息
    if (toolDefinitions.length > 0) {
      console.log('\n請在生成的檔案中完善以下內容:');
      console.log('1. 每個工具的詳細描述');
      console.log('2. 輸入參數的定義 (properties)');
      console.log('3. 必要參數列表 (required)');
    }
  } catch (error) {
    console.error('生成工具定義範本時發生錯誤:', error);
    throw error;
  }
}