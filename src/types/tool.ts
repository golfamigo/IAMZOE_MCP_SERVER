/**
 * 工具定義介面
 * 用於標準化所有工具的定義格式
 */
export interface ToolDefinition {
  /**
   * 工具名稱，必須是唯一的
   */
  name: string;
  
  /**
   * 工具說明
   */
  description: string;
  
  /**
   * 輸入參數的 JSON Schema 定義
   */
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
  
  /**
   * 工具的執行函數
   * @param params 輸入參數
   * @returns 工具執行的結果
   */
  execute: (params: any) => Promise<any>;
}

/**
 * 從 JSON Schema 驗證參數是否符合要求
 * 簡單實現，僅驗證必要參數是否存在
 * 
 * @param params 使用者提供的參數
 * @param schema JSON Schema 定義
 * @throws 若驗證失敗則拋出錯誤
 */
export function validateParams(params: any, schema: any): void {
  if (typeof params !== 'object' || params === null) {
    throw new Error('參數必須是一個物件');
  }
  
  // 驗證必要參數
  if (schema.required && Array.isArray(schema.required)) {
    for (const requiredProp of schema.required) {
      if (!(requiredProp in params)) {
        throw new Error(`缺少必要參數: ${requiredProp}`);
      }
      
      // 檢查空值
      if (params[requiredProp] === undefined || params[requiredProp] === null || params[requiredProp] === '') {
        throw new Error(`參數 ${requiredProp} 不能為空`);
      }
    }
  }
  
  // 驗證參數類型 (簡單實現)
  if (schema.properties) {
    for (const propName in params) {
      const propSchema = schema.properties[propName];
      if (propSchema) {
        if (propSchema.type === 'number' && typeof params[propName] !== 'number') {
          throw new Error(`參數 ${propName} 必須是數字類型`);
        } else if (propSchema.type === 'string' && typeof params[propName] !== 'string') {
          throw new Error(`參數 ${propName} 必須是字串類型`);
        } else if (propSchema.type === 'boolean' && typeof params[propName] !== 'boolean') {
          throw new Error(`參數 ${propName} 必須是布林類型`);
        } else if (propSchema.type === 'array' && !Array.isArray(params[propName])) {
          throw new Error(`參數 ${propName} 必須是陣列類型`);
        } else if (propSchema.type === 'object' && (typeof params[propName] !== 'object' || params[propName] === null)) {
          throw new Error(`參數 ${propName} 必須是物件類型`);
        }
        
        // 驗證枚舉值
        if (propSchema.enum && !propSchema.enum.includes(params[propName])) {
          throw new Error(`參數 ${propName} 必須是以下值之一: ${propSchema.enum.join(', ')}`);
        }
      }
    }
  }
}