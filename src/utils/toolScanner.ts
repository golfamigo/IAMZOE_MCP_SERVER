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
    console.error(`開始掃描工具目錄: ${toolsDir}`);
    
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
          console.error(`嘗試載入工具檔案: ${file.name}`);
          
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
            console.error(`在 ${file.name} 中找到 ${potentialTools.length} 個工具定義`);
            toolDefinitions.push(...potentialTools);
          } else {
            console.error(`警告: 在 ${file.name} 中沒有找到符合格式的工具定義`);
          }
        } catch (error) {
          console.error(`無法載入工具檔案 ${file.name}:`, error);
        }
      }
    }
    
    console.error(`掃描完成，共發現 ${toolDefinitions.length} 個工具定義`);
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
    console.error('開始檢查工具覆蓋率...');
    
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
            console.error(`警告: 在 ${file.name} 中發現可能未定義的工具實作: ${possibleToolName}`);
          }
        }
      }
    }
    
    console.error('工具覆蓋率檢查完成');
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
    console.error(`開始掃描目錄: ${toolsDir} 尋找工具實作...`);
    
    // 取得工具檔案列表
    const files = await fs.readdir(toolsDir, { withFileTypes: true });
    
    // 排除的檔案名稱
    const excludeFiles = ['index.ts', 'toolDefinitions.ts', 'generatedToolDefs.ts'];
    
    // 收集工具函數
    const toolDefinitions: Array<{
      fileName: string;
      toolName: string;
      description?: string;
      implementationName?: string;
      schemaContent?: string;
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
          ...content.matchAll(/(\w+):\s*async\s*\([^)]*\)\s*=>/g),
          ...content.matchAll(/export\s+const\s+(\w+)Impl\s*=\s*async\s*\([^)]*\)\s*=>/g)
        ];
        
        // 尋找使用 createToolDefinition 創建的工具定義
        const toolDefMatches = [
          ...content.matchAll(/export\s+const\s+(\w+)\s*=\s*createToolDefinition\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/g)
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
        
        // 尋找參數定義 Schema
        const schemaMatches = content.matchAll(/const\s+(\w+Schema)\s*=\s*{([\s\S]*?)};/g);
        const schemas: Map<string, string> = new Map();
        
        for (const match of Array.from(schemaMatches)) {
          const schemaName = match[1];
          const schemaContent = match[2];
          schemas.set(schemaName, schemaContent);
        }
        
        // 收集所有找到的工具函數
        for (const match of functionMatches) {
          const toolName = match[1];
          
          // 跳過已知的非工具函數
          if (['execute'].includes(toolName)) {
            continue;
          }
          
          // 如果是 xxxImpl 函數，則尋找對應的工具定義
          if (toolName.endsWith('Impl')) {
            const baseName = toolName.replace(/Impl$/, '');
            
            // 檢查是否有對應的工具定義
            const toolDefMatch = toolDefMatches.find(m => m[1] === baseName);
            
            if (toolDefMatch) {
              // 已經有對應的工具定義，跳過
              continue;
            }
          }
          
          // 尋找對應的 Schema
          const schemaName = `${toolName.replace(/Impl$/, '')}Schema`;
          const schemaContent = schemas.get(schemaName);
          
          toolDefinitions.push({
            fileName: file.name.replace('.ts', ''),
            toolName,
            description: descriptions.get(toolName) || `${toolName} 工具`,
            schemaContent
          });
        }
        
        // 收集所有使用 createToolDefinition 創建的工具定義
        for (const match of toolDefMatches) {
          const varName = match[1]; // 變數名稱，例如 createAdvertisement
          const toolName = match[2]; // 工具名稱，例如 'createAdvertisement'
          const description = match[3]; // 工具描述
          
          // 尋找對應的實現函數
          const implName = `${varName}Impl`;
          const implMatch = functionMatches.find(m => m[1] === implName);
          
          // 尋找對應的 Schema
          const schemaName = `${varName}Schema`;
          const schemaContent = schemas.get(schemaName);
          
          toolDefinitions.push({
            fileName: file.name.replace('.ts', ''),
            toolName: varName,
            description: description || descriptions.get(varName) || `${varName} 工具`,
            implementationName: implMatch ? implName : undefined,
            schemaContent
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
import { createToolDefinition } from '../utils/toolRegistration';
import { ToolDefinition } from '../types/tool';\n\n`;
    
    // 導入工具函數
    const imports = new Set<string>();
    toolDefinitions.forEach(tool => {
      if (tool.implementationName) {
        imports.add(`import { ${tool.implementationName} } from './${tool.fileName}';\n`);
      } else {
        imports.add(`import { ${tool.toolName} } from './${tool.fileName}';\n`);
      }
    });
    
    imports.forEach(importStmt => {
      fileContent += importStmt;
    });
    
    fileContent += `\n// 工具定義列表\nexport const generatedToolDefinitions: ToolDefinition[] = [\n`;
    
    // 添加每個工具的定義
    toolDefinitions.forEach(tool => {
      fileContent += `  // ${tool.fileName} 工具\n`;
      
      if (tool.implementationName) {
        // 使用 createToolDefinition 創建工具定義
        fileContent += `  createToolDefinition(\n`;
        fileContent += `    '${tool.toolName}',\n`;
        fileContent += `    '${tool.description}',\n`;
        fileContent += `    {\n`;
        fileContent += `      type: 'object',\n`;
        
        // 如果有找到 Schema 內容，則使用它
        if (tool.schemaContent) {
          // 提取 properties
          const propertiesMatch = tool.schemaContent.match(/properties\s*:\s*{([\s\S]*?)},/);
          if (propertiesMatch) {
            fileContent += `      properties: {${propertiesMatch[1]}},\n`;
          } else {
            fileContent += `      properties: {},\n`;
          }
          
          // 提取 required
          const requiredMatch = tool.schemaContent.match(/required\s*:\s*(\[[^\]]*\])/);
          if (requiredMatch) {
            fileContent += `      required: ${requiredMatch[1]}\n`;
          } else {
            fileContent += `      required: []\n`;
          }
        } else {
          // 沒有找到 Schema，使用預設值
          fileContent += `      properties: {},\n`;
          fileContent += `      required: []\n`;
        }
        
        fileContent += `    },\n`;
        fileContent += `    ${tool.implementationName}\n`;
        fileContent += `  ),\n\n`;
      } else {
        // 直接使用已有的工具定義
        fileContent += `  ${tool.toolName},\n\n`;
      }
    });
    
    fileContent += `];\n`;
    
    // 寫入檔案
    await fs.writeFile(outputFile, fileContent, 'utf-8');
    console.error(`已生成工具定義範本至: ${outputFile}`);
    console.error(`共找到 ${toolDefinitions.length} 個工具函數`);
  } catch (error) {
    console.error('生成工具定義範本時發生錯誤:', error);
    throw error;
  }
}