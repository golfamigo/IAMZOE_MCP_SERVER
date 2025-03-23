# 解決 Client-Server 通訊問題的步驟

根據對日誌的分析和代碼檢查，發現客戶端 (Claude AI) 嘗試調用未實現的 `resources/list` 和 `prompts/list` 方法。

## 問題詳情

- 客戶端定期調用 `resources/list` 和 `prompts/list` 方法
- 伺服器回應 `-32601` 錯誤碼，表示"Method not found"
- 這導致日誌中充滿了錯誤訊息

## 解決方案

已經修改 `src/index.ts` 文件，在主程式中添加了對這兩個方法的支持：

1. 添加了所需的類型引用：
   ```typescript
   import { ListToolsRequestSchema, ListResourcesRequestSchema, ListPromptsRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
   ```

2. 實現資源列表請求處理器，返回空資源列表：
   ```typescript
   server.setRequestHandler(ListResourcesRequestSchema, async () => {
     console.error('收到資源列表請求');  
     return {
       resources: [] // 返回空資源列表
     };
   });
   ```

3. 實現提示模板列表請求處理器，返回空提示模板列表：
   ```typescript
   server.setRequestHandler(ListPromptsRequestSchema, async () => {
     console.error('收到提示模板列表請求');
     return {
       prompts: [] // 返回空提示模板列表
     };
   });
   ```

## 測試步驟

1. 編譯項目：
   ```bash
   npm run build
   ```

2. 重新啟動服務：
   ```bash
   npm start
   ```

## 預期結果

- 客戶端請求將收到適當的空列表響應，而不是錯誤
- 日誌中將不再顯示大量 "Method not found" 錯誤
- 將看到 "收到資源列表請求" 和 "收到提示模板列表請求" 的日誌，表明方法已被成功調用