# MCP 工具使用與擴展指南

本文檔介紹如何使用、維護與擴展 IAM ZOE MCP Server 的工具系統。

## 目錄

1. [工具系統架構](#工具系統架構)
2. [標準化工具定義](#標準化工具定義)
3. [錯誤處理機制](#錯誤處理機制)
4. [新增工具的步驟](#新增工具的步驟)
5. [自動化工具定義生成](#自動化工具定義生成)

## 工具系統架構

IAM ZOE MCP Server 使用標準化的工具定義與錯誤處理機制，確保所有工具對外提供一致的接口與錯誤處理方式。

系統架構包含以下關鍵組件：

- **工具定義**：在 `src/tools/toolDefinitions.ts` 中統一定義所有工具
- **工具實現**：各工具的具體實現分布在 `src/tools/` 目錄下的各個模組中
- **工具類型**：在 `src/types/tool.ts` 中定義工具接口
- **錯誤處理**：在 `src/utils/errorHandling.ts` 中提供統一的錯誤處理機制
- **工具註冊**：在 `src/utils/toolRegistration.ts` 中提供工具註冊功能
- **工具掃描**：在 `src/utils/toolScanner.ts` 中提供自動掃描工具的功能

## 標準化工具定義

每個工具必須遵循標準化的定義格式，包含：

- **name**: 工具名稱
- **description**: 工具描述
- **inputSchema**: 輸入參數的 JSON Schema 定義
- **execute**: 執行工具的函數

示例：

```typescript
export const createAdvertisementTool: ToolDefinition = {
  name: 'createAdvertisement',
  description: '建立新的廣告',
  inputSchema: {
    type: 'object',
    properties: {
      business_id: { type: 'string', description: '商家 ID' },
      advertisement_name: { type: 'string', description: '廣告名稱' },
      // ...其他參數
    },
    required: [
      'business_id', 
      'advertisement_name',
      // ...其他必要參數
    ]
  },
  execute: advertisementTools.createAdvertisement
};
```

## 錯誤處理機制

系統提供統一的錯誤處理機制，將各種類型的錯誤轉換為 MCP 標準的錯誤格式。

常用的錯誤處理函數：

- `throwIfNotFound`: 拋出「找不到資源」錯誤
- `throwInvalidParam`: 拋出無效參數錯誤
- `throwBusinessLogicError`: 拋出業務邏輯錯誤
- `throwPermissionDenied`: 拋出權限拒絕錯誤
- `throwResourceConflict`: 拋出資源衝突錯誤

使用範例：

```typescript
// 檢查資源是否存在
if (!advertisement) {
  throwIfNotFound(advertisement_id, '廣告');
}

// 驗證參數
if (advertisement_name.length > 255) {
  throwInvalidParam('advertisement_name 超過最大長度 (255)');
}

// 檢查業務邏輯
if (currentStatus === 'completed' && status === 'active') {
  throwBusinessLogicError(`不允許將廣告狀態從 ${currentStatus} 更新為 ${status}`);
}
```

## 新增工具的步驟

1. 在適當的模組中實現工具功能
2. 在工具實現中使用標準的錯誤處理機制
3. 在 `src/tools/toolDefinitions.ts` 中添加工具定義
4. 在 toolDefinitions 陣列中註冊新工具

示例：

```typescript
// 1. 實現工具功能 (在某個工具模組中)
export const exampleTools = {
  myNewTool: async (params: MyNewToolParams): Promise<MyNewToolResult> => {
    // 參數驗證
    validateParams(params, myNewToolSchema);
    
    // 實現邏輯
    // ...
    
    // 返回結果
    return result;
  }
};

// 2. 在 toolDefinitions.ts 中添加定義
export const myNewTool: ToolDefinition = {
  name: 'myNewTool',
  description: '這是一個新工具',
  inputSchema: {
    // 定義 JSON Schema
  },
  execute: exampleTools.myNewTool
};

// 3. 在 toolDefinitions 陣列中註冊
export const toolDefinitions: ToolDefinition[] = [
  // 其他工具...
  myNewTool
];
```

## 自動化工具定義生成

系統提供自動掃描工具代碼並生成工具定義的功能，可以通過以下命令執行：

```bash
npm run generate-tools
```

這會掃描 `src/tools` 目錄下的所有工具實現，生成 `src/tools/generatedToolDefs.ts` 文件。

生成的定義是一個模板，需要手動審查並整合到 `toolDefinitions.ts` 中。

### 生成的定義範例：

```typescript
export const createAdvertisementTool: ToolDefinition = {
  name: 'createAdvertisement',
  description: '建立廣告',
  inputSchema: {
    type: 'object',
    properties: {
      business_id: { type: 'string' },
      advertisement_name: { type: 'string' },
      // ...
    },
    required: [
      'business_id',
      'advertisement_name',
      // ...
    ]
  },
  execute: async (params) => {
    // TODO: 實現 createAdvertisement 工具
    throw new Error('未實現');
  }
};
```

生成後需將 `execute` 屬性指向實際的工具實現。

---

通過以上標準化的工具定義與錯誤處理機制，可以確保 IAM ZOE MCP Server 的工具系統對外提供一致的接口與錯誤處理方式，方便擴展與維護。