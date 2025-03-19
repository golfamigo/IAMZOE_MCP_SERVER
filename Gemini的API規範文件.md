1.  **簡介 (Introduction)**
    *   簡述 MCP Server 的功能和用途。
    *   說明文件的目標讀者 (AI 開發人員)。
    *   說明技術堆疊。
2.  **通用設定 (General Settings)**
    *   API 基礎 URL。
    *   驗證方式 (例如，API 金鑰、JWT)。
    *   錯誤碼定義 (HTTP 狀態碼和自定義錯誤碼)。
3.  **API 端點 (API Endpoints)**
    *   針對每個 API 端點，提供以下資訊：
        *   端點名稱 (Endpoint Name)
        *   描述 (Description)
        *   HTTP 方法 (HTTP Method)
        *   URL 路徑 (URL Path)
        *   請求參數 (Request Parameters)
            *   參數名稱 (Parameter Name)
            *   資料類型 (Data Type)
            *   是否必填 (Required)
            *   描述 (Description)
        *   請求主體 (Request Body) (如果有的話)
            *   Content-Type
            *   Schema (JSON Schema)
            *   範例 (Example)
        *   回應 (Responses)
            *   HTTP 狀態碼 (HTTP Status Code)
            *   描述 (Description)
            *   Content-Type
            *   Schema (JSON Schema)
            *   範例 (Example)
        *   錯誤 (Errors)
            *   HTTP 狀態碼 (HTTP Status Code)
            *   自定義錯誤碼 (Custom Error Code)
            *   描述 (Description)
        *   業務邏輯 (Business Logic)
            *   詳細描述端點的業務邏輯，包括驗證、資料庫操作、錯誤處理等步驟。
        *   安全性考量 (Security Considerations)
            *   說明如何保護端點的安全，例如驗證使用者身份、防止注入攻擊。

**1. 簡介 (Introduction)**

MCP Server 旨在提供一個標準化的介面，讓客戶端 (例如 n8n、AI Agent) 可以與預約系統互動，並執行各種任務，例如建立預約、查詢可用時間、管理顧客資料等。

本文檔的目標讀者是 AI 開發人員，他們需要使用本文檔來理解 MCP Server 的 API，並生成能夠與之互動的程式碼。

本系統使用以下技術堆疊：

*   程式語言: Node.js
*   Web 框架: Express.js
*   圖形資料庫: Neo4j
*   資料庫連線庫: neo4j-driver
*   JSON Schema 驗證庫: ajv

**2. 通用設定 (General Settings)**

*   API 基礎 URL: `https://your-mcp-server.com/api/v1`
*   驗證方式:
    *   API 金鑰: 客戶端需要在 HTTP 請求標頭中包含 `X-API-Key` 標頭，並提供有效的 API 金鑰。
    *   JWT: 客戶端需要在 HTTP 請求標頭中包含 `Authorization` 標頭，並提供有效的 JWT (JSON Web Token)。
*   錯誤碼定義:

| HTTP 狀態碼 | 自定義錯誤碼 | 描述                                                              |
|-------------|--------------|-------------------------------------------------------------------|
| 400         | BAD_REQUEST  | 請求錯誤，例如無效的請求參數、格式錯誤的 JSON 資料。                      |
| 401         | UNAUTHORIZED | 未授權，缺少有效的 API 金鑰或 JWT。                               |
| 403         | FORBIDDEN    | 沒有足夠的權限存取資源。                                               |
| 404         | NOT_FOUND    | 找不到請求的資源。                                                   |
| 500         | SERVER_ERROR | 伺服器發生錯誤。                                                       |

**3. API 端點 (API Endpoints)**

### 3.1 建立預約 (Create Booking)

*   端點名稱: `Create Booking`
*   描述: 建立新的預約。
*   HTTP 方法: `POST`
*   URL 路徑: `/bookings`
*   請求參數: 無
*   請求主體:
    *   Content-Type: `application/json`
    *   Schema:

```json
{
  "type": "object",
  "properties": {
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "商家 ID",
      "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    },
    "bookable_item_id": {
      "type": "string",
      "format": "uuid",
      "description": "可預約項目 ID",
      "example": "b2c3d4e5-f6a7-8901-2345-67890abcdef1"
    },
    "booking_start_datetime": {
      "type": "string",
      "format": "date-time",
      "description": "預約開始時間 (ISO 8601 格式)",
      "example": "2025-03-20T14:00:00Z"
    },
    "booking_end_datetime": {
      "type": "string",
      "format": "date-time",
      "description": "預約結束時間 (ISO 8601 格式)",
      "example": "2025-03-20T15:00:00Z"
    },
    "booking_unit_count": {
      "type": "integer",
      "description": "預約數量",
      "example": 1
    }
  },
  "required": [
    "business_id",
    "bookable_item_id",
    "booking_start_datetime",
    "booking_end_datetime",
    "booking_unit_count"
  ]
}
```
    *   範例:

```json
{
  "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "bookable_item_id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
  "booking_start_datetime": "2025-03-20T14:00:00Z",
  "booking_end_datetime": "2025-03-20T15:00:00Z",
  "booking_unit_count": 1
}
```
*   回應:
    *   201 Created: 預約建立成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "booking_id": {
      "type": "string",
      "format": "uuid",
      "description": "新建立的預約 ID",
      "example": "c3d4e5f6-a7b8-9012-3456-7890abcdef23"
    }
  },
  "required": [
    "booking_id"
  ]
}
```

        *   範例:

```json
{
  "booking_id": "c3d4e5f6-a7b8-9012-3456-7890abcdef23"
}
```
    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "error_code": {
      "type": "string",
      "description": "錯誤代碼",
      "example": "BAD_REQUEST"
    },
    "message": {
      "type": "string",
      "description": "錯誤訊息",
      "example": "無效的請求參數。"
    }
  },
  "required": [
    "error_code",
    "message"
  ]
}
```
        *   範例:

```json
{
  "error_code": "BAD_REQUEST",
  "message": "無效的請求參數。"
}
```

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "error_code": {
      "type": "string",
      "description": "錯誤代碼",
      "example": "SERVER_ERROR"
    },
    "message": {
      "type": "string",
      "description": "錯誤訊息",
      "example": "伺服器發生錯誤。"
    }
  },
  "required": [
    "error_code",
    "message"
  ]
}
```

        *   範例:

```json
{
  "error_code": "SERVER_ERROR",
  "message": "伺服器發生錯誤。"
}
```

*   業務邏輯:
    1.  驗證 API 金鑰或 JWT。
    2.  從請求主體中獲取 `business_id`、`bookable_item_id`、`booking_start_datetime`、`booking_end_datetime` 和 `booking_unit_count`。
    3.  驗證 `business_id` 和 `bookable_item_id` 是否存在於資料庫中。
    4.  驗證 `booking_start_datetime` 和 `booking_end_datetime` 是否符合 ISO 8601 格式。
    5.  驗證 `booking_unit_count` 是否為正整數。
    6.  檢查可預約項目在指定時間範圍內是否可用 (考慮營業時間、員工排班等因素)。
    7.  建立新的預約記錄，並生成 `booking_id`。
    8.  將 `booking_id` 返回給客戶端。
    9.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:
    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   限制建立預約的頻率，防止惡意攻擊。


### 3.2 查詢可用時間 (Get Available Slots)

*   端點名稱: `Get Available Slots`
*   描述: 查詢指定可預約項目的可用時間段。
*   HTTP 方法: `GET`
*   URL 路徑: `/bookable_items/{bookable_item_id}/available_slots`
*   請求參數:
    *   `bookable_item_id` (Path): String，可預約項目 ID，必填。
    *   `start_date` (Query): String，查詢的開始日期 (YYYY-MM-DD 格式)，必填。
    *   `end_date` (Query): String，查詢的結束日期 (YYYY-MM-DD 格式)，必填。
*   請求主體: 無
*   回應:
    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "start_datetime": {
        "type": "string",
        "format": "date-time",
        "description": "可用時間段的開始時間 (ISO 8601 格式)",
        "example": "2025-03-20T14:00:00Z"
      },
      "end_datetime": {
        "type": "string",
        "format": "date-time",
        "description": "可用時間段的結束時間 (ISO 8601 格式)",
        "example": "2025-03-20T15:00:00Z"
      }
    },
    "required": [
      "start_datetime",
      "end_datetime"
    ]
  }
}
```

        *   範例:

```json
[
  {
    "start_datetime": "2025-03-20T14:00:00Z",
    "end_datetime": "2025-03-20T15:00:00Z"
  },
  {
    "start_datetime": "2025-03-20T16:00:00Z",
    "end_datetime": "2025-03-20T17:00:00Z"
  }
]
```
    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到可預約項目。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:
    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `bookable_item_id`。
    3.  從查詢參數中獲取 `start_date` 和 `end_date`。
    4.  驗證 `bookable_item_id` 是否存在於資料庫中。
    5.  驗證 `start_date` 和 `end_date` 是否符合 YYYY-MM-DD 格式。
    6.  查詢資料庫，獲取指定可預約項目在指定時間範圍內的可用時間段。
        *   考慮營業時間、員工排班、現有預約等因素。
    7.  將可用時間段列表返回給客戶端。
    8.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:
    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   限制查詢頻率，防止惡意攻擊。

### 3.3 取消預約 (Cancel Booking)

*   端點名稱: `Cancel Booking`
*   描述: 取消指定的預約。
*   HTTP 方法: `DELETE`
*   URL 路徑: `/bookings/{booking_id}`
*   請求參數:
    *   `booking_id` (Path): String，要取消的預約 ID，必填。
*   請求主體: 無
*   回應:
    *   204 No Content: 取消成功。

        *   沒有回應主體。
    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到要取消的預約。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:
    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `booking_id`。
    3.  驗證 `booking_id` 是否存在於資料庫中。
    4.  檢查目前時間是否在允許取消的時間範圍內 (例如，預約開始前 24 小時)。
    5.  將預約狀態更新為 "cancelled"。
    6.  如果成功取消預約，返回 204 No Content。
    7.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:
    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權取消該預約。

### 3.4 取得商家營業時間 (Get Business Hours)

*   端點名稱: `Get Business Hours`
*   描述: 取得指定商家的營業時間。
*   HTTP 方法: `GET`
*   URL 路徑: `/businesses/{business_id}/business_hours`
*   請求參數:
    *   `business_id` (Path): String，商家 ID，必填。
    *   `day_of_week` (Query): Integer，星期幾 (0=星期日, 6=星期六)，選填，如果省略則返回所有營業時間。
*   請求主體: 無
*   回應:
    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "day_of_week": {
        "type": "integer",
        "description": "星期幾 (0=星期日, 6=星期六)",
        "example": 0
      },
      "start_time": {
        "type": "string",
        "format": "time",
        "description": "開始時間 (HH:MM:SS 格式)",
        "example": "09:00:00"
      },
      "end_time": {
        "type": "string",
        "format": "time",
        "description": "結束時間 (HH:MM:SS 格式)",
        "example": "17:00:00"
      }
    },
    "required": [
      "day_of_week",
      "start_time",
      "end_time"
    ]
  }
}
```

        *   範例:

```json
[
  {
    "day_of_week": 0,
    "start_time": "09:00:00",
    "end_time": "17:00:00"
  },
  {
    "day_of_week": 1,
    "start_time": "09:00:00",
    "end_time": "17:00:00"
  }
]
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   404 Not Found: 找不到商家。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `business_id`。
    3.  從查詢參數中獲取 `day_of_week` (如果有的話)。
    4.  驗證 `business_id` 是否存在於資料庫中。
    5.  驗證 `day_of_week` 是否為 0 到 6 之間的整數 (如果有的話)。
    6.  查詢資料庫，獲取指定商家的營業時間。
        *   如果指定了 `day_of_week`，則只返回該星期的營業時間。
        *   如果沒有指定 `day_of_week`，則返回所有營業時間。
    7.  將營業時間列表返回給客戶端。
    8.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。

### 3.5 推薦相似顧客 (Recommend Similar Customers)

*   端點名稱: `Recommend Similar Customers`
*   描述: 根據顧客的預約記錄，推薦與指定顧客有相似偏好的其他顧客。
*   HTTP 方法: `GET`
*   URL 路徑: `/customers/{customer_id}/recommendations/similar_customers`
*   請求參數:
    *   `customer_id` (Path): String，顧客 ID，必填。
    *   `limit` (Query): Integer, 返回多少個推薦，選填，默認10個
*   請求主體: 無
*   回應:

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "customer_profile_id": {
        "type": "string",
        "format": "uuid",
        "description": "顧客 ID",
        "example": "d4e5f6a7-b8c9-0123-4567-890abcdef345"
      },
      "customer_name": {
        "type": "string",
        "description": "顧客姓名",
        "example": "王小明"
      },
      "common_items": {
        "type": "integer",
        "description": "與指定顧客共同預約的可預約項目數量",
        "example": 3
      }
    },
    "required": [
      "customer_profile_id",
      "customer_name",
      "common_items"
    ]
  }
}
```

        *   範例:
```json
[
  {
    "customer_profile_id": "d4e5f6a7-b8c9-0123-4567-890abcdef345",
    "customer_name": "王小明",
    "common_items": 3
  },
  {
    "customer_profile_id": "e5f6a7b8-c9d0-1234-5678-90abcdef4567",
    "customer_name": "李美麗",
    "common_items": 2
  }
]
```

        *   400 Bad Request: 請求錯誤。
                *   Content-Type: `application/json`
                *   Schema: (同 3.1 建立預約 的 400 回應)
                *   範例: (同 3.1 建立預約 的 400 回應)
        *   404 Not Found: 找不到顧客。
                *   Content-Type: `application/json`
                *   Schema: (同 3.1 建立預約 的 400 回應)
                *   範例: (同 3.1 建立預約 的 400 回應)
        *   500 Server Error: 伺服器錯誤。
                *   Content-Type: `application/json`
                *   Schema: (同 3.1 建立預約 的 500 回應)
                *   範例: (同 3.1 建立預約 的 500 回應)
    *   業務邏輯:
        1.  驗證 API 金鑰或 JWT。
        2.  從 URL 路徑中獲取 `customer_id`。
        3.  從查詢參數中獲取 `limit` (如果有的話)。
        4.  驗證 `customer_id` 是否存在於資料庫中。
        5.  查詢資料庫，根據指定的顧客 ID，找到與之有相似偏好的其他顧客。
        *基於共同預約的可預約項目數量來計算相似度。*
        6.  將推薦的顧客列表返回給客戶端。
        7.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。
    *   安全性考量:
        *   驗證 API 金鑰或 JWT。
        *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
        *   限制查詢頻率，防止惡意攻擊。

### 3.6 尋找協作員工 (Find Collaborating Staff)

*   端點名稱: `Find Collaborating Staff`
*   描述: 尋找經常一起提供服務的員工。
*   HTTP 方法: `GET`
*   URL 路徑: `/businesses/{business_id}/staff/collaborators`
*   請求參數:
    *   `business_id` (Path): String， 商家 ID， 必填。
    *   `staff_member_id` (Query): String，員工ID，選填，如果存在則查詢指定員工的協作者，反之，找出整個商家最常協作的員工
    *   `limit` (Query): Integer, 返回多少個協作者，選填，默認10個
*   請求主體: 無
*   回應:
    *   200 OK: 查詢成功。
        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "staff_member_id": {
        "type": "string",
        "format": "uuid",
        "description": "員工 ID",
        "example": "f6a7b8c9-d0e1-2345-6789-0abcdef56789"
      },
      "staff_member_name": {
        "type": "string",
        "description": "員工姓名",
        "example": "陳志明"
      },
      "common_bookings": {
        "type": "integer",
        "description": "與指定員工共同參與的預約數量",
        "example": 5
      }
    },
    "required": [
      "staff_member_id",
      "staff_member_name",
      "common_bookings"
    ]
  }
}
```

        *   範例:

```json
[
  {
    "staff_member_id": "f6a7b8c9-d0e1-2345-6789-0abcdef56789",
    "staff_member_name": "陳志明",
    "common_bookings": 5
  },
  {
    "staff_member_id": "a7b8c9d0-e1f2-3456-7890-abcdef67890a",
    "staff_member_name": "林淑芬",
    "common_bookings": 3
  }
]
```
    *   400 Bad Request: 請求錯誤。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)
        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到商家。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)
        *   範例: (同 3.1 建立預約 的 400 回應)
    *   500 Server Error: 伺服器錯誤。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)
        *   範例: (同 3.1 建立預約 的 500 回應)
*   業務邏輯:
    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `business_id`。
    3.  從查詢參數中獲取 `staff_member_id` 和 `limit` (如果有的話)。
    4.  驗證 `business_id` 是否存在於資料庫中。
    5.  查詢資料庫，找到與指定員工經常一起提供服務的其他員工。
        *基於共同參與的預約數量來計算協作關係。*
    6.  將推薦的員工列表返回給客戶端。
    7.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。
*   安全性考量:
    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   限制查詢頻率，防止惡意攻擊。

### 3.7 推薦相關服務 (Recommend Related Services)

*   端點名稱: `Recommend Related Services`
*   描述: 根據顧客預訂過的服務，推薦相關的服務。
*   HTTP 方法: `GET`
*   URL 路徑: `/bookable_items/{bookable_item_id}/recommendations/related_services`
*   請求參數:
    *   `bookable_item_id` (Path): String，可預約項目 ID， 必填。
    *   `limit` (Query): Integer, 返回多少個推薦，選填，默認10個
*   請求主體: 無
*   回應:
    *   200 OK: 查詢成功。
        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "bookable_item_id": {
        "type": "string",
        "format": "uuid",
        "description": "可預約項目 ID",
        "example": "7b8c9d0e-1f2a-3456-7890-abcdef7890ab"
      },
      "bookable_item_name": {
        "type": "string",
        "description": "可預約項目名稱",
        "example": "深層清潔護髮"
      },
      "common_bookings": {
        "type": "integer",
        "description": "與指定可預約項目共同被預約的次數",
        "example": 4
      }
    },
    "required": [
      "bookable_item_id",
      "bookable_item_name",
      "common_bookings"
    ]
  }
}
```

        *   範例:

```json
[
  {
    "bookable_item_id": "7b8c9d0e-1f2a-3456-7890-abcdef7890ab",
    "bookable_item_name": "深層清潔護髮",
    "common_bookings": 4
  },
  {
    "bookable_item_id": "8c9d0e1f-2a3b-4567-890a-bcdef890abc1",
    "bookable_item_name": "頭皮SPA",
    "common_bookings": 2
  }
]
```

    *   400 Bad Request: 請求錯誤。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)
        *   範例: (同 3.1 建立預約 的 400 回應)
    *   444 Not Found: 找不到可預約項目。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)
        *   範例: (同 3.1 建立預約 的 400 回應)
    *   500 Server Error: 伺服器錯誤。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)
        *   範例: (同 3.1 建立預約 的 500 回應)
    *   業務邏輯:
        1.  驗證 API 金鑰或 JWT。
        2.  從 URL 路徑中獲取 `bookable_item_id`。
        3.  從查詢參數中獲取 `limit` (如果有的話)。
        4.  驗證 `bookable_item_id` 是否存在於資料庫中。
        5.  查詢資料庫，找到與指定可預約項目相關的其他可預約項目。
            *   *基於共同被預約的次數來計算關聯性。*
        6.  將推薦的可預約項目列表返回給客戶端。
        7.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。
    *   安全性考量:
        *   驗證 API 金鑰或 JWT。
        *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
        *   限制查詢頻率，防止惡意攻擊。

### 3.8 建立顧客 (Create Customer)

*   端點名稱: `Create Customer`
*   描述: 建立新的顧客。
*   HTTP 方法: `POST`
*   URL 路徑: `/customers`
*   請求參數: 無
*   請求主體:
    *   Content-Type: `application/json`
    *   Schema:

```json
{
  "type": "object",
  "properties": {
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "商家 ID",
      "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    },
    "customer_name": {
      "type": "string",
      "description": "顧客姓名",
      "example": "王小明"
    },
    "customer_email": {
      "type": "string",
      "format": "email",
      "description": "顧客 Email",
      "example": "wang.xiaoming@example.com"
    },
    "customer_phone": {
      "type": "string",
      "description": "顧客電話",
      "example": "0912345678"
    },
    "customer_birthdate": {
      "type": "string",
      "format": "date",
      "description": "顧客生日 (YYYY-MM-DD 格式)",
      "example": "1990-01-01"
    },
    "gender": {
        "type": "string",
        "description": "客戶性別，取值範圍包括 male, female, other",
        "example": "male"
    }
  },
  "required": [
    "business_id",
    "customer_name",
    "customer_email"
  ]
}
```

    *   範例:

```json
{
  "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "customer_name": "王小明",
  "customer_email": "wang.xiaoming@example.com",
  "customer_phone": "0912345678",
  "customer_birthdate": "1990-01-01",
  "gender": "male"
}
```

*   回應:

    *   201 Created: 顧客建立成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "customer_profile_id": {
      "type": "string",
      "format": "uuid",
      "description": "新建立的顧客 ID",
      "example": "c3d4e5f6-a7b8-9012-3456-7890abcdef23"
    }
  },
  "required": [
    "customer_profile_id"
  ]
}
```

        *   範例:

```json
{
  "customer_profile_id": "c3d4e5f6-a7b8-9012-3456-7890abcdef23"
}
```
    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從請求主體中獲取 `business_id`、`customer_name`、`customer_email`、`customer_phone` 和 `customer_birthdate`。
    3.  驗證 `business_id` 是否存在於資料庫中。
    4.  驗證 `customer_email` 是否符合 Email 格式的正則表達式。
    5.  驗證 `customer_birthdate` 是否符合 YYYY-MM-DD 格式 (如果有的話)。
    6.  檢查 `customer_email` 是否已存在於資料庫中。
    7.  建立新的顧客記錄，並生成 `customer_profile_id`。
    8.  將 `customer_profile_id` 返回給客戶端。
    9.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   限制建立顧客的頻率，防止惡意攻擊。

### 3.9 取得顧客資訊 (Get Customer)

*   端點名稱: `Get Customer`
*   描述: 取得指定顧客的資訊。
*   HTTP 方法: `GET`
*   URL 路徑: `/customers/{customer_profile_id}`
*   請求參數:

    *   `customer_profile_id` (Path): String，顧客 ID，必填。

*   請求主體: 無
*   回應:

    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "customer_profile_id": {
      "type": "string",
      "format": "uuid",
      "description": "顧客 ID",
      "example": "c3d4e5f6-a7b8-9012-3456-7890abcdef23"
    },
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "商家 ID",
      "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    },
    "customer_name": {
      "type": "string",
      "description": "顧客姓名",
      "example": "王小明"
    },
    "customer_email": {
      "type": "string",
      "format": "email",
      "description": "顧客 Email",
      "example": "wang.xiaoming@example.com"
    },
    "customer_phone": {
      "type": "string",
      "description": "顧客電話",
      "example": "0912345678"
    },
    "customer_birthdate": {
      "type": "string",
      "format": "date",
      "description": "顧客生日 (YYYY-MM-DD 格式)",
      "example": "1990-01-01"
    },
        "gender": {
          "type": "string",
          "description": "客戶性別，取值範圍包括 male, female, other",
          "example": "male"
        }
  },
  "required": [
    "customer_profile_id",
    "business_id",
    "customer_name",
    "customer_email"
  ]
}
```

        *   範例:

```json
{
  "customer_profile_id": "c3d4e5f6-a7b8-9012-3456-7890abcdef23",
  "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "customer_name": "王小明",
  "customer_email": "wang.xiaoming@example.com",
  "customer_phone": "0912345678",
  "customer_birthdate": "1990-01-01",
  "gender": "male"
}
```
    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到顧客。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `customer_profile_id`。
    3.  驗證 `customer_profile_id` 是否存在於資料庫中。
    4.  查詢資料庫，獲取指定顧客的資訊。
    5.  將顧客資訊返回給客戶端。
    6.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權存取該顧客的資訊。

### 3.10 更新顧客資訊 (Update Customer)

*   端點名稱: `Update Customer`
*   描述: 更新指定顧客的資訊。
*   HTTP 方法: `PUT`
*   URL 路徑: `/customers/{customer_profile_id}`
*   請求參數:

    *   `customer_profile_id` (Path): String，顧客 ID，必填。

*   請求主體:

    *   Content-Type: `application/json`
    *   Schema: (同 3.8 建立顧客 的請求主體，但所有屬性都改為選填)

    *   範例:

```json
{
  "customer_name": "王小明 (已更新)",
  "customer_phone": "0987654321"
}
```

*   回應:

    *   204 No Content: 更新成功。

        *   沒有回應主體。

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到顧客。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `customer_profile_id`。
    3.  驗證 `customer_profile_id` 是否存在於資料庫中。
    4.  從請求主體中獲取要更新的顧客資訊。
    5.  驗證要更新的欄位是否符合對應的資料類型和格式。
    6.  更新資料庫中指定顧客的資訊。
    7.  如果成功更新顧客資訊，返回 204 No Content。
    8.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權更新該顧客的資訊。

### 3.11 刪除顧客 (Delete Customer)

*   端點名稱: `Delete Customer`
*   描述: 刪除指定的顧客。
*   HTTP 方法: `DELETE`
*   URL 路徑: `/customers/{customer_profile_id}`
*   請求參數:

    *   `customer_profile_id` (Path): String，顧客 ID，必填。

*   請求主體: 無
*   回應:

    *   204 No Content: 刪除成功。

        *   沒有回應主體。

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到顧客。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `customer_profile_id`。
    3.  驗證 `customer_profile_id` 是否存在於資料庫中。
    4.  檢查該顧客是否還有未完成的預約。
    5.  刪除資料庫中指定顧客的資訊。
    6.  如果成功刪除顧客，返回 204 No Content。
    7.  如果發生任何錯誤

### 3.12 查詢顧客列表 (List Customers)

*   端點名稱: `List Customers`
*   描述: 查詢符合條件的顧客列表。
*   HTTP 方法: `GET`
*   URL 路徑: `/customers`
*   請求參數:
    *   `business_id` (Query): String，商家 ID，必填。
    *   `membership_level_id` (Query): String，會員等級 ID，選填，如果指定，則只返回該會員等級的顧客。
    *   `limit` (Query): Integer，每頁返回的顧客數量，選填，預設值為 10。
    *   `offset` (Query): Integer，偏移量，用於分頁，選填，預設值為 0。
*   請求主體: 無
*   回應:

    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "total": {
      "type": "integer",
      "description": "符合條件的顧客總數",
      "example": 100
    },
    "customers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "customer_profile_id": {
            "type": "string",
            "format": "uuid",
            "description": "顧客 ID",
            "example": "c3d4e5f6-a7b8-9012-3456-7890abcdef23"
          },
          "business_id": {
            "type": "string",
            "format": "uuid",
            "description": "商家 ID",
            "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
          },
          "customer_name": {
            "type": "string",
            "description": "顧客姓名",
            "example": "王小明"
          },
          "customer_email": {
            "type": "string",
            "format": "email",
            "description": "顧客 Email",
            "example": "wang.xiaoming@example.com"
          },
          "customer_phone": {
            "type": "string",
            "description": "顧客電話",
            "example": "0912345678"
          },
          "customer_birthdate": {
            "type": "string",
            "format": "date",
            "description": "顧客生日 (YYYY-MM-DD 格式)",
            "example": "1990-01-01"
          }
        },
        "required": [
          "customer_profile_id",
          "business_id",
          "customer_name",
          "customer_email"
        ]
      }
    },
  "required":[
    "total",
    "customers"
  ]
  }
}
```

        *   範例:

```json
{
  "total": 100,
  "customers": [
    {
      "customer_profile_id": "c3d4e5f6-a7b8-9012-3456-7890abcdef23",
      "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "customer_name": "王小明",
      "customer_email": "wang.xiaoming@example.com",
      "customer_phone": "0912345678",
      "customer_birthdate": "1990-01-01"
    },
    {
      "customer_profile_id": "d4e5f6a7-b8c9-0123-4567-890abcdef345",
      "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "customer_name": "李美麗",
      "customer_email": "li.meili@example.com",
      "customer_phone": "0987654321",
      "customer_birthdate": "1988-05-15"
    }
  ]
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從查詢參數中獲取 `business_id`、`membership_level_id`、`limit` 和 `offset`。
    3.  驗證 `business_id` 是否存在於資料庫中。
    4.  驗證 `membership_level_id` 是否存在於資料庫中 (如果有的話)。
    5.  查詢資料庫，獲取符合條件的顧客列表，並計算總數。
    6.  將顧客列表和總數返回給客戶端。
    7.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權查詢該商家的顧客資訊。

---

**員工管理 (Staff Management)** 的 API 端點。

### 3.13 建立員工 (Create Staff)

*   端點名稱: `Create Staff`
*   描述: 建立新的員工。
*   HTTP 方法: `POST`
*   URL 路徑: `/staff`
*   請求參數: 無
*   請求主體:

    *   Content-Type: `application/json`
    *   Schema:

```json
{
  "type": "object",
  "properties": {
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "商家 ID",
      "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    },
    "staff_member_name": {
      "type": "string",
      "description": "員工姓名",
      "example": "陳志明"
    },
    "staff_member_email": {
      "type": "string",
      "format": "email",
      "description": "員工 Email",
      "example": "chen.zhiming@example.com"
    },
    "staff_member_phone": {
      "type": "string",
      "description": "員工電話",
      "example": "0933222111"
    },
    "staff_member_hire_date": {
      "type": "string",
      "format": "date",
      "description": "員工雇用日期 (YYYY-MM-DD 格式)",
      "example": "2023-01-01"
    }
  },
  "required": [
    "business_id",
    "staff_member_name",
    "staff_member_email"
  ]
}
```

    *   範例:

```json
{
  "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "staff_member_name": "陳志明",
  "staff_member_email": "chen.zhiming@example.com",
  "staff_member_phone": "0933222111",
  "staff_member_hire_date": "2023-01-01"
}
```

*   回應:

    *   201 Created: 員工建立成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "staff_member_id": {
      "type": "string",
      "format": "uuid",
      "description": "新建立的員工 ID",
      "example": "e5f6a7b8-c9d0-1234-5678-90abcdef4567"
    }
  },
  "required": [
    "staff_member_id"
  ]
}
```

        *   範例:

```json
{
  "staff_member_id": "e5f6a7b8-c9d0-1234-5678-90abcdef4567"
}
```
    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從請求主體中獲取 `business_id`、`staff_member_name`、`staff_member_email` 和 `staff_member_hire_date`。
    3.  驗證 `business_id` 是否存在於資料庫中。
    4.  驗證 `staff_member_email` 是否符合 Email 格式的正則表達式。
    5.  驗證 `staff_member_hire_date` 是否符合 YYYY-MM-DD 格式 (如果有的話)。
    6.  檢查 `staff_member_email` 是否已存在於資料庫中。
    7.  建立新的員工記錄，並生成 `staff_member_id`。
    8.  將 `staff_member_id` 返回給客戶端。
    9.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   限制建立員工的頻率，防止惡意攻擊。
好的，我繼續完成員工管理 (Staff Management) 的 API 端點。

### 3.14 取得員工資訊 (Get Staff)

*   端點名稱: `Get Staff`
*   描述: 取得指定員工的資訊。
*   HTTP 方法: `GET`
*   URL 路徑: `/staff/{staff_member_id}`
*   請求參數:

    *   `staff_member_id` (Path): String，員工 ID，必填。

*   請求主體: 無
*   回應:

    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "staff_member_id": {
      "type": "string",
      "format": "uuid",
      "description": "員工 ID",
      "example": "e5f6a7b8-c9d0-1234-5678-90abcdef4567"
    },
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "商家 ID",
      "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    },
    "staff_member_name": {
      "type": "string",
      "description": "員工姓名",
      "example": "陳志明"
    },
    "staff_member_email": {
      "type": "string",
      "format": "email",
      "description": "員工 Email",
      "example": "chen.zhiming@example.com"
    },
    "staff_member_phone": {
      "type": "string",
      "description": "員工電話",
      "example": "0933222111"
    },
    "staff_member_hire_date": {
      "type": "string",
      "format": "date",
      "description": "員工雇用日期 (YYYY-MM-DD 格式)",
      "example": "2023-01-01"
    },
    "staff_member_termination_date": {
      "type": "string",
      "format": "date",
      "description": "員工離職日期 (YYYY-MM-DD 格式)",
      "example": "2024-01-01"
    },
    "staff_member_is_active": {
      "type": "boolean",
      "description": "員工是否啟用",
      "example": true
    }
  },
  "required": [
    "staff_member_id",
    "business_id",
    "staff_member_name",
    "staff_member_email"
  ]
}
```

        *   範例:

```json
{
  "staff_member_id": "e5f6a7b8-c9d0-1234-5678-90abcdef4567",
  "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "staff_member_name": "陳志明",
  "staff_member_email": "chen.zhiming@example.com",
  "staff_member_phone": "0933222111",
  "staff_member_hire_date": "2023-01-01",
  "staff_member_termination_date": "2024-01-01",
  "staff_member_is_active": true
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到員工。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `staff_member_id`。
    3.  驗證 `staff_member_id` 是否存在於資料庫中。
    4.  查詢資料庫，獲取指定員工的資訊。
    5.  將員工資訊返回給客戶端。
    6.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權存取該員工的資訊。

### 3.15 更新員工資訊 (Update Staff)

*   端點名稱: `Update Staff`
*   描述: 更新指定員工的資訊。
*   HTTP 方法: `PUT`
*   URL 路徑: `/staff/{staff_member_id}`
*   請求參數:

    *   `staff_member_id` (Path): String，員工 ID，必填。

*   請求主體:

    *   Content-Type: `application/json`
    *   Schema: (同 3.13 建立員工 的請求主體，但所有屬性都改為選填)

    *   範例:

```json
{
  "staff_member_name": "陳志明 (已更新)",
  "staff_member_phone": "0911111222",
  "staff_member_is_active": false
}
```

*   回應:

    *   204 No Content: 更新成功。

        *   沒有回應主體。

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到員工。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `staff_member_id`。
    3.  驗證 `staff_member_id` 是否存在於資料庫中。
    4.  從請求主體中獲取要更新的員工資訊。
    5.  驗證要更新的欄位是否符合對應的資料類型和格式。
    6.  更新資料庫中指定員工的資訊。
    7.  如果成功更新員工資訊，返回 204 No Content。
    8.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權更新該員工的資訊。

### 3.16 刪除員工 (Delete Staff)

*   端點名稱: `Delete Staff`
*   描述: 刪除指定的員工。
*   HTTP 方法: `DELETE`
*   URL 路徑: `/staff/{staff_member_id}`
*   請求參數:

    *   `staff_member_id` (Path): String，員工 ID，必填。

*   請求主體: 無
*   回應:

    *   204 No Content: 刪除成功。

        *   沒有回應主體。

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到員工。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `staff_member_id`。
    3.  驗證 `staff_member_id` 是否存在於資料庫中
    4.  檢查該員工是否還有未完成的預約。
    5.  刪除資料庫中指定員工的資訊。
    6.  如果成功刪除員工，返回 204 No Content。
    7.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權刪除該員工。

### 3.17 查詢員工列表 (List Staff)

*   端點名稱: `List Staff`
*   描述: 查詢符合條件的員工列表。
*   HTTP 方法: `GET`
*   URL 路徑: `/staff`
*   請求參數:

    *   `business_id` (Query): String，商家 ID，必填。
    *   `is_active` (Query): Boolean，是否只返回啟用的員工，選填。
    *   `limit` (Query): Integer，每頁返回的員工數量，選填，預設值為 10。
    *   `offset` (Query): Integer，偏移量，用於分頁，選填，預設值為 0。

*   請求主體: 無
*   回應:

    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "total": {
      "type": "integer",
      "description": "符合條件的員工總數",
      "example": 50
    },
    "staff": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "staff_member_id": {
            "type": "string",
            "format": "uuid",
            "description": "員工 ID",
            "example": "e5f6a7b8-c9d0-1234-5678-90abcdef4567"
          },
          "business_id": {
            "type": "string",
            "format": "uuid",
            "description": "商家 ID",
            "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
          },
          "staff_member_name": {
            "type": "string",
            "description": "員工姓名",
            "example": "陳志明"
          },
          "staff_member_email": {
            "type": "string",
            "format": "email",
            "description": "員工 Email",
            "example": "chen.zhiming@example.com"
          },
          "staff_member_phone": {
            "type": "string",
            "description": "員工電話",
            "example": "0933222111"
          },
          "staff_member_hire_date": {
            "type": "string",
            "format": "date",
            "description": "員工雇用日期 (YYYY-MM-DD 格式)",
            "example": "2023-01-01"
          }
        },
        "required": [
          "staff_member_id",
          "business_id",
          "staff_member_name",
          "staff_member_email"
        ]
      }
    },
     "required":[
        "total",
        "staff"
      ]
  }
}
```

        *   範例:

```json
{
  "total": 50,
  "staff": [
    {
      "staff_member_id": "e5f6a7b8-c9d0-1234-5678-90abcdef4567",
      "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "staff_member_name": "陳志明",
      "staff_member_email": "chen.zhiming@example.com",
      "staff_member_phone": "0933222111",
      "staff_member_hire_date": "2023-01-01"
    },
    {
      "staff_member_id": "f6a7b8c9-d0e1-2345-6789-0abcdef56789",
      "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "staff_member_name": "林淑芬",
      "staff_member_email": "lin.shufen@example.com",
      "staff_member_phone": "0922111333",
      "staff_member_hire_date": "2022-05-15"
    }
  ]
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從查詢參數中獲取 `business_id`、`is_active`、`limit` 和 `offset`。
    3.  驗證 `business_id` 是否存在於資料庫中。
    4.  查詢資料庫，獲取符合條件的員工列表，並計算總數。
        *   如果指定了 `is_active`，則只返回啟用的或未啟用的員工。
    5.  將員工列表和總數返回給客戶端。
    6.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權查詢該商家的員工資訊。

---

現在我開始定義 **服務管理 (Service Management)** 的 API 端點。 在這裡，「服務」指的是 `BookableItem`，也就是可預約的項目。

### 3.18 建立服務 (Create Service)

*   端點名稱: `Create Service`
*   描述: 建立新的服務 (可預約項目)。
*   HTTP 方法: `POST`
*   URL 路徑: `/services`
*   請求參數: 無
*   請求主體:

    *   Content-Type: `application/json`
    *   Schema:

```json
{
  "type": "object",
  "properties": {
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "商家 ID",
      "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    },
    "bookable_item_type_code": {
      "type": "string",
      "description": "服務類型 (service, resource, event, teaching, table, room)",
      "example": "service"
    },
    "bookable_item_name": {
      "type": "string",
      "description": "服務名稱",
      "example": "剪髮"
    },
    "bookable_item_description": {
      "type": "string",
      "description": "服務描述",
      "example": "精緻剪髮服務"
    },
    "bookable_item_duration": {
      "type": "string",
      "description": "服務持續時間 (例如: 30 minutes, 1 hour)",
      "example": "30 minutes"
    },
    "bookable_item_price": {
      "type": "number",
      "description": "服務價格",
      "example": 500
    }
  },
  "required": [
    "business_id",
    "bookable_item_type_code",
    "bookable_item_name",
    "bookable_item_duration"
  ]
}
```

    *   範例:

```json
{
  "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "bookable_item_type_code": "service",
  "bookable_item_name": "剪髮",
  "bookable_item_description": "精緻剪髮服務",
  "bookable_item_duration": "30 minutes",
  "bookable_item_price": 500
}
```

*   回應:

    *   201 Created: 服務建立成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "bookable_item_id": {
      "type": "string",
      "format": "uuid",
      "description": "新建立的服務 ID",
      "example": "12345678-90ab-cdef-1234-567890abcdef"
    }
  },
  "required": [
    "bookable_item_id"
  ]
}
```

        *   範例:

```json
{
  "bookable_item_id": "12345678-90ab-cdef-1234-567890abcdef"
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從請求主體中獲取 `business_id`、`bookable_item_type_code`、`bookable_item_name`、`bookable_item_description`、`bookable_item_duration` 和 `bookable_item_price`。
    3.  驗證 `business_id` 是否存在於資料庫中。
    4.  驗證 `bookable_item_type_code` 是否為允許的值之一 (service, resource, event, teaching, table, room)。
    5.  驗證 `bookable_item_name` 是否為空。
    6.  驗證 `bookable_item_duration` 是否為有效的持續時間格式。
    7.  驗證 `bookable_item_price` 是否為有效的數字 (如果提供)。
    8.  建立新的服務記錄，並生成 `bookable_item_id`。
    9.  將 `bookable_item_id` 返回給客戶端。
    10. 如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   限制建立服務的頻率，防止惡意攻擊。

OK，我繼續完成服務管理 (Service Management) 的 API 端點。

### 3.19 取得服務資訊 (Get Service)

*   端點名稱: `Get Service`
*   描述: 取得指定服務 (可預約項目) 的資訊。
*   HTTP 方法: `GET`
*   URL 路徑: `/services/{bookable_item_id}`
*   請求參數:
    *   `bookable_item_id` (Path): String，服務 ID，必填。
*   請求主體: 無
*   回應:

    *   200 OK: 查詢成功。
        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "bookable_item_id": {
      "type": "string",
      "format": "uuid",
      "description": "服務 ID",
      "example": "12345678-90ab-cdef-1234-567890abcdef"
    },
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "商家 ID",
      "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    },
    "bookable_item_type_code": {
      "type": "string",
      "description": "服務類型 (service, resource, event, teaching, table, room)",
      "example": "service"
    },
    "bookable_item_name": {
      "type": "string",
      "description": "服務名稱",
      "example": "剪髮"
    },
    "bookable_item_description": {
      "type": "string",
      "description": "服務描述",
      "example": "精緻剪髮服務"
    },
    "bookable_item_duration": {
      "type": "string",
      "description": "服務持續時間 (例如: 30 minutes, 1 hour)",
      "example": "30 minutes"
    },
    "bookable_item_price": {
      "type": "number",
      "description": "服務價格",
      "example": 500
    }
  },
  "required": [
    "bookable_item_id",
    "business_id",
    "bookable_item_type_code",
    "bookable_item_name",
    "bookable_item_duration"
  ]
}
```
        *   範例:

```json
{
  "bookable_item_id": "12345678-90ab-cdef-1234-567890abcdef",
  "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "bookable_item_type_code": "service",
  "bookable_item_name": "剪髮",
  "bookable_item_description": "精緻剪髮服務",
  "bookable_item_duration": "30 minutes",
  "bookable_item_price": 500
}
```
    *   400 Bad Request: 請求錯誤。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)
        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到服務。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)
        *   範例: (同 3.1 建立預約 的 400 回應)
    *   500 Server Error: 伺服器錯誤。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)
        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `bookable_item_id`。
    3.  驗證 `bookable_item_id` 是否存在於資料庫中。
    4.  查詢資料庫，獲取指定服務的資訊。
    5.  將服務資訊返回給客戶端。
    6.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權存取該服務的資訊。

### 3.20 更新服務資訊 (Update Service)

*   端點名稱: `Update Service`
*   描述: 更新指定服務 (可預約項目) 的資訊。
*   HTTP 方法: `PUT`
*   URL 路徑: `/services/{bookable_item_id}`
*   請求參數:
    *   `bookable_item_id` (Path): String，服務 ID，必填。
*   請求主體:
    *   Content-Type: `application/json`
    *   Schema: (同 3.18 建立服務 的請求主體，但所有屬性都改為選填)
    *   範例:

```json
{
  "bookable_item_name": "精緻剪髮 (已更新)",
  "bookable_item_price": 600
}
```

*   回應:

    *   204 No Content: 更新成功。
        *   沒有回應主體。
    *   400 Bad Request: 請求錯誤。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)
        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到服務。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)
        *   範例: (同 3.1 建立預約 的 400 回應)
    *   500 Server Error: 伺服器錯誤。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)
        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `bookable_item_id`。
    3.  驗證 `bookable_item_id` 是否存在於資料庫中。
    4.  從請求主體中獲取要更新的服務資訊。
    5.  驗證要更新的欄位是否符合對應的資料類型和格式。
    6.  更新資料庫中指定服務的資訊。
    7.  如果成功更新服務資訊，返回 204 No Content。
    8.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權更新該服務的資訊。

### 3.21 刪除服務 (Delete Service)

*   端點名稱: `Delete Service`
*   描述: 刪除指定的服務 (可預約項目)。
*   HTTP 方法: `DELETE`
*   URL 路徑: `/services/{bookable_item_id}`
*   請求參數:
    *   `bookable_item_id` (Path): String，服務 ID，必填。
*   請求主體: 無
*   回應:

    *   204 No Content: 刪除成功。
        *   沒有回應主體。
    *   400 Bad Request: 請求錯誤。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)
        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到服務。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)
        *   範例: (同 3.1 建立預約 的 400 回應)
    *   500 Server Error: 伺服器錯誤。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)
        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `bookable_item_id`。
    3.  驗證 `bookable_item_id` 是否存在於資料庫中。
    4.  檢查該服務是否還有未完成的預約。
    5.  刪除資料庫中指定服務的資訊。
    6.  如果成功刪除服務，返回 204 No Content。
    7.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權刪除該服務

好的，我繼續完成服務管理 (Service Management) 的 API 端點，並開始建立類別管理 (Category Management) 的 API 規格。

### 3.22 查詢服務列表 (List Services)

*   端點名稱: `List Services`
*   描述: 查詢符合條件的服務 (可預約項目) 列表。
*   HTTP 方法: `GET`
*   URL 路徑: `/services`
*   請求參數:
    *   `business_id` (Query): String，商家 ID，必填。
    *   `category_id` (Query): String，類別 ID，選填，如果指定，則只返回該類別下的服務。
    *   `type` (Query): String，服務類型 (service, resource, event, teaching, table, room)，選填，如果指定，則只返回該類型的服務。
    *   `limit` (Query): Integer，每頁返回的服務數量，選填，預設值為 10。
    *   `offset` (Query): Integer，偏移量，用於分頁，選填，預設值為 0。

*   請求主體: 無
*   回應:
    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "total": {
      "type": "integer",
      "description": "符合條件的服務總數",
      "example": 100
    },
    "services": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "bookable_item_id": {
            "type": "string",
            "format": "uuid",
            "description": "服務 ID",
            "example": "12345678-90ab-cdef-1234-567890abcdef"
          },
          "business_id": {
            "type": "string",
            "format": "uuid",
            "description": "商家 ID",
            "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
          },
          "bookable_item_type_code": {
            "type": "string",
            "description": "服務類型 (service, resource, event, teaching, table, room)",
            "example": "service"
          },
          "bookable_item_name": {
            "type": "string",
            "description": "服務名稱",
            "example": "剪髮"
          },
          "bookable_item_description": {
            "type": "string",
            "description": "服務描述",
            "example": "精緻剪髮服務"
          },
          "bookable_item_duration": {
            "type": "string",
            "description": "服務持續時間 (例如: 30 minutes, 1 hour)",
            "example": "30 minutes"
          },
          "bookable_item_price": {
            "type": "number",
            "description": "服務價格",
            "example": 500
          }
        },
        "required": [
          "bookable_item_id",
          "business_id",
          "bookable_item_type_code",
          "bookable_item_name",
          "bookable_item_duration"
        ]
      }
    },
    "required":[
      "total",
      "services"
    ]
  }
}
```

        *   範例:

```json
{
  "total": 100,
  "services": [
    {
      "bookable_item_id": "12345678-90ab-cdef-1234-567890abcdef",
      "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "bookable_item_type_code": "service",
      "bookable_item_name": "剪髮",
      "bookable_item_description": "精緻剪髮服務",
      "bookable_item_duration": "30 minutes",
      "bookable_item_price": 500
    },
    {
      "bookable_item_id": "23456789-0abc-def1-2345-67890abcdef0",
      "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "bookable_item_type_code": "service",
      "bookable_item_name": "洗髮",
      "bookable_item_description": "專業洗髮服務",
      "bookable_item_duration": "15 minutes",
      "bookable_item_price": 300
    }
  ]
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從查詢參數中獲取 `business_id`、`category_id`、`type`、`limit` 和 `offset`。
    3.  驗證 `business_id` 是否存在於資料庫中。
    4.  驗證 `category_id` 是否存在於資料庫中 (如果有的話)。
    5.  驗證 `type` 是否為允許的值之一 (service, resource, event, teaching, table, room) (如果有的話)。
    6.  查詢資料庫，獲取符合條件的服務列表，並計算總數。
        *   如果指定了 `category_id`，則只返回該類別下的服務。
        *   如果指定了 `type`，則只返回該類型的服務。
    7.  將服務列表和總數返回給客戶端。
    8.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權查詢該商家的服務資訊。

---

**類別管理 (Category Management)** 的 API 端點。

### 3.23 建立類別 (Create Category)

*   端點名稱: `Create Category`
*   描述: 建立新的類別。
*   HTTP 方法: `POST`
*   URL 路徑: `/categories`
*   請求參數: 無
*   請求主體:

    *   Content-Type: `application/json`
    *   Schema:

```json
{
  "type": "object",
  "properties": {
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "商家 ID",
      "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    },
    "category_name": {
      "type": "string",
      "description": "類別名稱",
      "example": "髮型設計"
    },
    "category_description": {
      "type": "string",
      "description": "類別描述",
      "example": "提供各種髮型設計服務"
    }
  },
  "required": [
    "business_id",
    "category_name"
  ]
}
```

    *   範例:

```json
{
  "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "category_name": "髮型設計",
  "category_description": "提供各種髮型設計服務"
}
```

*   回應:

    *   201 Created: 類別建立成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "bookable_item_category_id": {
      "type": "string",
      "format": "uuid",
      "description": "新建立的類別 ID",
      "example": "34567890-abcd-ef12-3456-7890abcdef12"
    }
  },
  "required": [
    "bookable_item_category_id"
  ]
}
```

        *   範例:

```json
{
  "bookable_item_category_id": "34567890-abcd-ef12-3456-7890abcdef12"
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從請求主體中獲取 `business_id`、`category_name` 和 `category_description`。
    3.  驗證 `business_id` 是否存在於資料庫中。
    4.  驗證 `category_name` 是否為空。
    5.  檢查該商家下是否已存在同名的類別。
    6.  建立新的類別記錄，並生成 `bookable_item_category_id`。
    7.  將 `bookable_item_category_id` 返回給客戶端。
    8.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   限制建立類別的頻率，防止惡意攻擊。


### 3.24 取得類別資訊 (Get Category)

*   端點名稱: `Get Category`
*   描述: 取得指定類別的資訊。
*   HTTP 方法: `GET`
*   URL 路徑: `/categories/{bookable_item_category_id}`
*   請求參數:

    *   `bookable_item_category_id` (Path): String，類別 ID，必填。

*   請求主體: 無
*   回應:

    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "bookable_item_category_id": {
      "type": "string",
      "format": "uuid",
      "description": "類別 ID",
      "example": "34567890-abcd-ef12-3456-7890abcdef12"
    },
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "商家 ID",
      "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    },
    "category_name": {
      "type": "string",
      "description": "類別名稱",
      "example": "髮型設計"
    },
    "category_description": {
      "type": "string",
      "description": "類別描述",
      "example": "提供各種髮型設計服務"
    }
  },
  "required": [
    "bookable_item_category_id",
    "business_id",
    "category_name"
  ]
}
```

        *   範例:

```json
{
  "bookable_item_category_id": "34567890-abcd-ef12-3456-7890abcdef12",
  "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "category_name": "髮型設計",
  "category_description": "提供各種髮型設計服務"
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到類別。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `bookable_item_category_id`。
    3.  驗證 `bookable_item_category_id` 是否存在於資料庫中。
    4.  查詢資料庫，獲取指定類別的資訊。
    5.  將類別資訊返回給客戶端。
    6.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權存取該類別的資訊。

### 3.25 更新類別資訊 (Update Category)

*   端點名稱: `Update Category`
*   描述: 更新指定類別的資訊。
*   HTTP 方法: `PUT`
*   URL 路徑: `/categories/{bookable_item_category_id}`
*   請求參數:

    *   `bookable_item_category_id` (Path): String，類別 ID，必填。

*   請求主體:

    *   Content-Type: `application/json`
    *   Schema: (同 3.23 建立類別 的請求主體，但所有屬性都改為選填)

    *   範例:

```json
{
  "category_name": "髮型設計 (已更新)",
  "category_description": "提供各種專業髮型設計服務"
}
```

*   回應:

    *   204 No Content: 更新成功。

        *   沒有回應主體。

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到類別。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `bookable_item_category_id`。
    3.  驗證 `bookable_item_category_id` 是否存在於資料庫中。
    4.  從請求主體中獲取要更新的類別資訊。
    5.  驗證要更新的欄位是否符合對應的資料類型和格式。
    6.  更新資料庫中指定類別的資訊。
    7.  如果成功更新類別資訊，返回 204 No Content。
    8.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權更新該類別的資訊。

### 3.26 刪除類別 (Delete Category)

*   端點名稱: `Delete Category`
*   描述: 刪除指定的類別。
*   HTTP 方法: `DELETE`
*   URL 路徑: `/categories/{bookable_item_category_id}`
*   請求參數:

    *   `bookable_item_category_id` (Path): String，類別 ID，必填。

*   請求主體: 無
*   回應:

    *   204 No Content: 刪除成功。

        *   沒有回應主體。

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到類別。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `bookable_item_category_id`。
    3.  驗證 `bookable_item_category_id` 是否存在於資料庫中。
    4.  檢查該類別下是否還有服務。
    5.  刪除資料庫中指定類別的資訊。
    6.  如果成功刪除類別，返回 204 No Content。
    7.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權刪除該類別

OK，我繼續完成類別管理 (Category Management) 的 API 端點，並開始建立會員等級管理 (Membership Level Management) 的 API 規格。

### 3.27 查詢類別列表 (List Categories)

*   端點名稱: `List Categories`
*   描述: 查詢符合條件的類別列表。
*   HTTP 方法: `GET`
*   URL 路徑: `/categories`
*   請求參數:

    *   `business_id` (Query): String，商家 ID，必填。
    *   `limit` (Query): Integer，每頁返回的類別數量，選填，預設值為 10。
    *   `offset` (Query): Integer，偏移量，用於分頁，選填，預設值為 0。

*   請求主體: 無
*   回應:

    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "total": {
      "type": "integer",
      "description": "符合條件的類別總數",
      "example": 50
    },
    "categories": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "bookable_item_category_id": {
            "type": "string",
            "format": "uuid",
            "description": "類別 ID",
            "example": "34567890-abcd-ef12-3456-7890abcdef12"
          },
          "business_id": {
            "type": "string",
            "format": "uuid",
            "description": "商家 ID",
            "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
          },
          "category_name": {
            "type": "string",
            "description": "類別名稱",
            "example": "髮型設計"
          },
          "category_description": {
            "type": "string",
            "description": "類別描述",
            "example": "提供各種髮型設計服務"
          }
        },
        "required": [
          "bookable_item_category_id",
          "business_id",
          "category_name"
        ]
      }
    },
    "required":[
      "total",
      "categories"
    ]
  }
}
```

        *   範例:

```json
{
  "total": 50,
  "categories": [
    {
      "bookable_item_category_id": "34567890-abcd-ef12-3456-7890abcdef12",
      "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "category_name": "髮型設計",
      "category_description": "提供各種髮型設計服務"
    },
    {
      "bookable_item_category_id": "4567890a-bcde-f123-4567-890abcdef123",
      "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "category_name": "身體護理",
      "category_description": "提供各種身體護理服務"
    }
  ]
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從查詢參數中獲取 `business_id`、`limit` 和 `offset`。
    3.  驗證 `business_id` 是否存在於資料庫中。
    4.  查詢資料庫，獲取指定商家的類別列表，並計算總數。
    5.  將類別列表和總數返回給客戶端。
    6.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權查詢該商家的類別資訊。

---

**會員等級管理 (Membership Level Management)** 的 API 端點。

### 3.28 建立會員等級 (Create Membership Level)

*   端點名稱: `Create Membership Level`
*   描述: 建立新的會員等級。
*   HTTP 方法: `POST`
*   URL 路徑: `/membership_levels`
*   請求參數: 無
*   請求主體:

    *   Content-Type: `application/json`
    *   Schema:

```json
{
  "type": "object",
  "properties": {
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "商家 ID",
      "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    },
    "membership_level_name": {
      "type": "string",
      "description": "會員等級名稱",
      "example": "黃金會員"
    },
    "membership_level_description": {
      "type": "string",
      "description": "會員等級描述",
      "example": "享有更多折扣和優惠"
    },
    "membership_level_benefits": {
      "type": "string",
      "description": "會員等級福利",
      "example": "每月享有一次免費洗髮"
    }
  },
  "required": [
    "business_id",
    "membership_level_name"
  ]
}
```

    *   範例:

```json
{
  "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "membership_level_name": "黃金會員",
  "membership_level_description": "享有更多折扣和優惠",
  "membership_level_benefits": "每月享有一次免費洗髮"
}
```

*   回應:

    *   201 Created: 會員等級建立成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "membership_level_id": {
      "type": "string",
      "format": "uuid",
      "description": "新建立的會員等級 ID",
      "example": "567890ab-cdef-1234-5678-90abcdef1234"
    }
  },
  "required": [
    "membership_level_id"
  ]
}
```

        *   範例:

```json
{
  "membership_level_id": "567890ab-cdef-1234-5678-90abcdef1234"
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從請求主體中獲取 `business_id`、`membership_level_name`、`membership_level_description` 和 `membership_level_benefits`。
    3.  驗證 `business_id` 是否存在於資料庫中。
    4.  驗證 `membership_level_name` 是否為空。
    5.  檢查該商家下是否已存在同名的會員等級。
    6.  建立新的會員等級記錄，並生成 `membership_level_id`。
    7.  將 `membership_level_id` 返回給客戶端。
    8.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   限制建立會員等級的頻率，防止惡意攻擊。


### 3.29 取得會員等級資訊 (Get Membership Level)

*   端點名稱: `Get Membership Level`
*   描述: 取得指定會員等級的資訊。
*   HTTP 方法: `GET`
*   URL 路徑: `/membership_levels/{membership_level_id}`
*   請求參數:

    *   `membership_level_id` (Path): String，會員等級 ID，必填。

*   請求主體: 無
*   回應:

    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "membership_level_id": {
      "type": "string",
      "format": "uuid",
      "description": "會員等級 ID",
      "example": "567890ab-cdef-1234-5678-90abcdef1234"
    },
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "商家 ID",
      "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    },
    "membership_level_name": {
      "type": "string",
      "description": "會員等級名稱",
      "example": "黃金會員"
    },
    "membership_level_description": {
      "type": "string",
      "description": "會員等級描述",
      "example": "享有更多折扣和優惠"
    },
    "membership_level_benefits": {
      "type": "string",
      "description": "會員等級福利",
      "example": "每月享有一次免費洗髮"
    }
  },
  "required": [
    "membership_level_id",
    "business_id",
    "membership_level_name"
  ]
}
```

        *   範例:

```json
{
  "membership_level_id": "567890ab-cdef-1234-5678-90abcdef1234",
  "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "membership_level_name": "黃金會員",
  "membership_level_description": "享有更多折扣和優惠",
  "membership_level_benefits": "每月享有一次免費洗髮"
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到會員等級。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `membership_level_id`。
    3.  驗證 `membership_level_id` 是否存在於資料庫中。
    4.  查詢資料庫，獲取指定會員等級的資訊。
    5.  將會員等級資訊返回給客戶端。
    6.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權存取該會員等級的資訊。

### 3.30 更新會員等級資訊 (Update Membership Level)

*   端點名稱: `Update Membership Level`
*   描述: 更新指定會員等級的資訊。
*   HTTP 方法: `PUT`
*   URL 路徑: `/membership_levels/{membership_level_id}`
*   請求參數:

    *   `membership_level_id` (Path): String，會員等級 ID，必填。

*   請求主體:

    *   Content-Type: `application/json`
    *   Schema: (同 3.28 建立會員等級 的請求主體，但所有屬性都改為選填)

    *   範例:

```json
{
  "membership_level_name": "白金會員",
  "membership_level_description": "享有尊榮服務和獨家優惠"
}
```

*   回應:

    *   204 No Content: 更新成功。

        *   沒有回應主體。

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到會員等級。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `membership_level_id`。
    3.  驗證 `membership_level_id` 是否存在於資料庫中。
    4.  從請求主體中獲取要更新的會員等級資訊。
    5.  驗證要更新的欄位是否符合對應的資料類型和格式。
    6.  更新資料庫中指定會員等級的資訊。
    7.  如果成功更新會員等級資訊，返回 204 No Content。
    8.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權更新該會員等級的資訊。

### 3.31 刪除會員等級 (Delete Membership Level)

*   端點名稱: `Delete Membership Level`
*   描述: 刪除指定的會員等級。
*   HTTP 方法: `DELETE`
*   URL 路徑: `/membership_levels/{membership_level_id}`
*   請求參數:

    *   `membership_level_id` (Path): String，會員等級 ID，必填。

*   請求主體: 無
*   回應:

    *   204 No Content: 刪除成功。

        *   沒有回應主體。

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到會員等級。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `membership_level_id`。
    3.  驗證 `membership_level_id` 是否存在於資料庫中。
    4.  檢查是否還有顧客屬於該會員等級。
    5.  刪除資料庫中指定會員等級的資訊。
    6.  如果成功刪除會員等級，返回 204 No Content。
    7.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權刪除該會員等級

### 3.32 查詢會員等級列表 (List Membership Levels)

*   端點名稱: `List Membership Levels`
*   描述: 查詢符合條件的會員等級列表。
*   HTTP 方法: `GET`
*   URL 路徑: `/membership_levels`
*   請求參數:

    *   `business_id` (Query): String，商家 ID，必填。
    *   `limit` (Query): Integer，每頁返回的會員等級數量，選填，預設值為 10。
    *   `offset` (Query): Integer，偏移量，用於分頁，選填，預設值為 0。

*   請求主體: 無
*   回應:

    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "total": {
      "type": "integer",
      "description": "符合條件的會員等級總數",
      "example": 50
    },
    "membership_levels": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "membership_level_id": {
            "type": "string",
            "format": "uuid",
            "description": "會員等級 ID",
            "example": "567890ab-cdef-1234-5678-90abcdef1234"
          },
          "business_id": {
            "type": "string",
            "format": "uuid",
            "description": "商家 ID",
            "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
          },
          "membership_level_name": {
            "type": "string",
            "description": "會員等級名稱",
            "example": "黃金會員"
          },
          "membership_level_description": {
            "type": "string",
            "description": "會員等級描述",
            "example": "享有更多折扣和優惠"
          },
          "membership_level_benefits": {
            "type": "string",
            "description": "會員等級福利",
            "example": "每月享有一次免費洗髮"
          }
        },
        "required": [
          "membership_level_id",
          "business_id",
          "membership_level_name"
        ]
      }
    },
    "required": [
      "total",
      "membership_levels"
    ]
  }
}
```

        *   範例:

```json
{
  "total": 50,
  "membership_levels": [
    {
      "membership_level_id": "567890ab-cdef-1234-5678-90abcdef1234",
      "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "membership_level_name": "黃金會員",
      "membership_level_description": "享有更多折扣和優惠",
      "membership_level_benefits": "每月享有一次免費洗髮"
    },
    {
      "membership_level_id": "67890abc-def1-2345-6789-0abcdef12345",
      "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "membership_level_name": "白金會員",
      "membership_level_description": "享有尊榮服務和獨家優惠",
      "membership_level_benefits": "每月享有兩次免費洗髮和一次護髮"
    }
  ]
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從查詢參數中獲取 `business_id`、`limit` 和 `offset`。
    3.  驗證 `business_id` 是否存在於資料庫中
    4.  查詢資料庫，獲取指定商家的會員等級列表，並計算總數。
    5.  將會員等級列表和總數返回給客戶端。
    6.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權查詢該商家的會員等級資訊。

**至此，我完成了以下 API 類別的規格描述：**

*   預約管理 (Booking Management)
*   顧客管理 (Customer Management)
*   員工管理 (Staff Management)
*   服務管理 (Service Management)
*   類別管理 (Category Management)
*   會員等級管理 (Membership Level Management)

我理解了！ 你希望在你的預約系統中加入廣告功能，讓使用者 (User) 能夠以聯盟行銷 (Affiliate Marketing) 的方式，將廣告發送給其他使用者。 這些廣告需要先經過你的系統註冊審核，才能被使用者發送。 而你的前端介面是各種通訊 App，透過 AI Bot 操作 MCP Server 來達成。

根據這個新的需求，我建議新增以下 API 類別：

1.  **廣告管理 (Advertisement Management)**
2.  **使用者關係 (User Relationship Management)**

**接下來，我會針對這兩個 API 類別，建立詳細的 API 規格。**

### 4. 廣告管理 (Advertisement Management)

#### 4.1 建立廣告 (Create Advertisement)

*   端點名稱: `Create Advertisement`
*   描述: 建立新的廣告。
*   HTTP 方法: `POST`
*   URL 路徑: `/advertisements`
*   請求參數: 無
*   請求主體:

    *   Content-Type: `application/json`
    *   Schema:

```json
{
  "type": "object",
  "properties": {
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "商家 ID",
      "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    },
    "advertisement_name": {
      "type": "string",
      "description": "廣告名稱",
      "example": "夏季優惠活動"
    },
    "advertisement_description": {
      "type": "string",
      "description": "廣告描述",
      "example": "夏季期間享有所有服務 8 折優惠"
    },
    "advertisement_image_url": {
      "type": "string",
      "format": "url",
      "description": "廣告圖片 URL",
      "example": "https://example.com/images/summer_sale.jpg"
    },
    "advertisement_landing_page_url": {
      "type": "string",
      "format": "url",
      "description": "廣告落地頁 URL",
      "example": "https://example.com/summer_sale"
    },
    "advertisement_start_date": {
      "type": "string",
      "format": "date",
      "description": "廣告開始日期 (YYYY-MM-DD 格式)",
      "example": "2025-04-01"
    },
    "advertisement_end_date": {
      "type": "string",
      "format": "date",
      "description": "廣告結束日期 (YYYY-MM-DD 格式)",
      "example": "2025-06-30"
    },
    "advertisement_budget": {
      "type": "number",
      "description": "廣告預算",
      "example": 1000
    },
    "advertisement_target_audience": {
      "type": "string",
      "description": "廣告目標受眾 (JSON 格式)",
      "example": "{\"gender\": \"female\", \"age_min\": 25, \"age_max\": 35}"
    }
  },
  "required": [
    "business_id",
    "advertisement_name",
    "advertisement_description",
    "advertisement_image_url",
    "advertisement_landing_page_url",
    "advertisement_start_date",
    "advertisement_end_date",
    "advertisement_budget",
    "advertisement_target_audience"
  ]
}
```

    *   範例:

```json
{
  "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "advertisement_name": "夏季優惠活動",
  "advertisement_description": "夏季期間享有所有服務 8 折優惠",
  "advertisement_image_url": "https://example.com/images/summer_sale.jpg",
  "advertisement_landing_page_url": "https://example.com/summer_sale",
  "advertisement_start_date": "2025-04-01",
  "advertisement_end_date": "2025-06-30",
  "advertisement_budget": 1000,
  "advertisement_target_audience": "{\"gender\": \"female\", \"age_min\": 25, \"age_max\": 35}"
}
```

*   回應:

    *   201 Created: 廣告建立成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "advertisement_id": {
      "type": "string",
      "format": "uuid",
      "description": "新建立的廣告 ID",
      "example": "7890abcd-ef12-3456-7890-abcdef123456"
    }
  },
  "required": [
    "advertisement_id"
  ]
}
```

        *   範例:

```json
{
  "advertisement_id": "7890abcd-ef12-3456-7890-abcdef123456"
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從請求主體中獲取廣告相關資訊。
    3.  驗證 `business_id` 是否存在於資料庫中。
    4.  驗證廣告相關資訊是否符合格式和規則。
    5.  建立新的廣告記錄，並生成 `advertisement_id`。
    6.  將 `advertisement_id` 返回給客戶端。
    7.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   限制建立廣告的權限，只有授權的使用者才能建立廣告。

#### 4.2 取得廣告資訊 (Get Advertisement)

*   端點名稱: `Get Advertisement`
*   描述: 取得指定廣告的資訊。
*   HTTP 方法: `GET`
*   URL 路徑: `/advertisements/{advertisement_id}`
*   請求參數:

    *   `advertisement_id` (Path): String，廣告 ID，必填。

*   請求主體: 無
*   回應:

    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "advertisement_id": {
      "type": "string",
      "format": "uuid",
      "description": "廣告 ID",
      "example": "7890abcd-ef12-3456-7890-abcdef123456"
    },
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "商家 ID",
      "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    },
    "advertisement_name": {
      "type": "string",
      "description": "廣告名稱",
      "example": "夏季優惠活動"
    },
    "advertisement_description": {
      "type": "string",
      "description": "廣告描述",
      "example": "夏季期間享有所有服務 8 折優惠"
    },
    "advertisement_image_url": {
      "type": "string",
      "format": "url",
      "description": "廣告圖片 URL",
      "example": "https://example.com/images/summer_sale.jpg"
    },
    "advertisement_landing_page_url": {
      "type": "string",
      "format": "url",
      "description": "廣告落地頁 URL",
      "example": "https://example.com/summer_sale"
    },
    "advertisement_start_date": {
      "type": "string",
      "format": "date",
      "description": "廣告開始日期 (YYYY-MM-DD 格式)",
      "example": "2025-04-01"
    },
    "advertisement_end_date": {
      "type": "string",
      "format": "date",
      "description": "廣告結束日期 (YYYY-MM-DD 格式)",
      "example": "2025-06-30"
    },
    "advertisement_budget": {
      "type": "number",
      "description": "廣告預算",
      "example": 1000
    },
    "advertisement_target_audience": {
      "type": "string",
      "description": "廣告目標受眾 (JSON 格式)",
      "example": "{\"gender\": \"female\", \"age_min\": 25, \"age_max\": 35}"
    }
  },
  "required": [
    "advertisement_id",
    "business_id",
    "advertisement_name",
    "advertisement_description",
    "advertisement_image_url",
    "advertisement_landing_page_url",
    "advertisement_start_date",
    "advertisement_end_date",
    "advertisement_budget",
    "advertisement_target_audience"
  ]
}
```

        *   範例:

```json
{
  "advertisement_id": "7890abcd-ef12-3456-7890-abcdef123456",
  "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "advertisement_name": "夏季優惠活動",
  "advertisement_description": "夏季期間享有所有服務 8 折優惠",
  "advertisement_image_url": "https://example.com/images/summer_sale.jpg",
  "advertisement_landing_page_url": "https://example.com/summer_sale",
  "advertisement_start_date": "2025-04-01",
  "advertisement_end_date": "2025-06-30",
  "advertisement_budget": 1000,
  "advertisement_target_audience": "{\"gender\": \"female\", \"age_min\": 25, \"age_max\": 35}"
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到廣告。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `advertisement_id`。
    3.  驗證 `advertisement_id` 是否存在於資料庫中。
    4.  查詢資料庫，獲取指定廣告的資訊。
    5.  將廣告資訊返回給客戶端。
    6.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權存取該廣告的資訊。

#### 4.3 更新廣告資訊 (Update Advertisement)

*   端點名稱: `Update Advertisement`
*   描述: 更新指定廣告的資訊。
*   HTTP 方法: `PUT`
*   URL 路徑: `/advertisements/{advertisement_id}`
*   請求參數:

    *   `advertisement_id` (Path): String，廣告 ID，必填。

*   請求主體:

    *   Content-Type: `application/json`
    *   Schema: (同 4.1 建立廣告 的請求主體，但所有屬性都改為選填)

    *   範例:

```json
{
  "advertisement_name": "夏季大優惠活動",
  "advertisement_budget": 1500
}
```

*   回應:

    *   204 No Content: 更新成功。

        *   沒有回應主體。

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到廣告。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `advertisement_id`。
    3.  驗證 `advertisement_id` 是否存在於資料庫中。
    4.  從請求主體中獲取要更新的廣告資訊。
    5.  驗證要更新的欄位是否符合對應的資料類型和格式。
    6.  更新資料庫中指定廣告的資訊。
    7.  如果成功更新廣告資訊，返回 204 No Content。
    8.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權更新該廣告的資訊。

#### 4.4 刪除廣告 (Delete Advertisement)

*   端點名稱: `Delete Advertisement`
*   描述: 刪除指定的廣告。
*   HTTP 方法: `DELETE`
*   URL 路徑: `/advertisements/{advertisement_id}`
*   請求參數:

    *   `advertisement_id` (Path): String，廣告 ID，必填。

*   請求主體: 無
*   回應:

    *   204 No Content: 刪除成功。

        *   沒有回應主體。

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到廣告。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `advertisement_id`。
    3.  驗證 `advertisement_id` 是否存在於資料庫中。
    4.  檢查該廣告是否還有未發送的預算。
    5.  刪除資料庫中指定廣告的資訊。
    6.  如果成功刪除廣告，返回 204 No Content。
    7.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權刪除該廣告。

#### 4.5 查詢廣告列表 (List Advertisements)

*   端點名稱: `List Advertisements`
*   描述: 查詢符合條件的廣告列表。
*   HTTP 方法: `GET`
*   URL 路徑: `/advertisements`
*   請求參數:

    *   `business_id` (Query): String，商家 ID，必填。
    *   `is_active` (Query): Boolean，是否只返回有效的廣告，選填。
    *   `limit` (Query): Integer，每頁返回的廣告數量，選填，預設值為 10。
    *   `offset` (Query): Integer，偏移量，用於分頁，選填，預設值為 0。

*   請求主體: 無
*   回應:

    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "total": {
      "type": "integer",
      "description": "符合條件的廣告總數",
      "example": 50
    },
    "advertisements": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "advertisement_id": {
            "type": "string",
            "format": "uuid",
            "description": "廣告 ID",
            "example": "7890abcd-ef12-3456-7890-abcdef123456"
          },
          "business_id": {
            "type": "string",
            "format": "uuid",
            "description": "商家 ID",
            "example": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
          },
          "advertisement_name": {
            "type": "string",
            "description": "廣告名稱",
            "example": "夏季優惠活動"
          },
          "advertisement_description": {
            "type": "string",
            "description": "廣告描述",
            "example": "夏季期間享有所有服務 8 折優惠"
          },
          "advertisement_image_url": {
            "type": "string",
            "format": "url",
            "description": "廣告圖片 URL",
            "example": "https://example.com/images/summer_sale.jpg"
          },
          "advertisement_landing_page_url": {
            "type": "string",
            "format": "url",
            "description": "廣告落地頁 URL",
            "example": "https://example.com/summer_sale"
          }
        },
        "required": [
          "advertisement_id",
          "business_id",
          "advertisement_name",
          "advertisement_description",
          "advertisement_image_url",
          "advertisement_landing_page_url"
        ]
      }
    },
        "required": [
          "total",
          "advertisements"
        ]
  }
}
```

        *   範例:

```json
{
  "total": 50,
  "advertisements": [
    {
      "advertisement_id": "7890abcd-ef12-3456-7890-abcdef123456",
      "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "advertisement_name": "夏季優惠活動",
      "advertisement_description": "夏季期間享有所有服務 8 折優惠",
      "advertisement_image_url": "https://example.com/images/summer_sale.jpg",
      "advertisement_landing_page_url": "https://example.com/summer_sale"
    },
    {
      "advertisement_id": "890abcde-f123-4567-890a-bcdef1234567",
      "business_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "advertisement_name": "秋季新品上市",
      "advertisement_description": "秋季新品全面上市，歡迎選購",
      "advertisement_image_url": "https://example.com/images/autumn_new.jpg",
      "advertisement_landing_page_url": "https://example.com/autumn_new"
    }
  ]
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從查詢參數中獲取 `business_id`、`is_active`、`limit` 和 `offset`。
    3.  驗證 `business_id` 是否存在於資料庫中。
    4.  查詢資料庫，獲取符合條件的廣告列表，並計算總數。
        *   如果指定了 `is_active`，則只返回有效的廣告 (廣告開始日期 <= 今天 <= 廣告結束日期)。
    5.  將廣告列表和總數返回給客戶端。
    6.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權查詢該商家的廣告資訊。

#### 4.6 審核廣告 (Approve/Reject Advertisement)

* 端點名稱: `Approve/Reject Advertisement`
* 描述: 管理員審核廣告，批准或拒絕廣告的發布。
* HTTP 方法: `POST`
* URL 路徑: `/advertisements/{advertisement_id}/approval`
* 請求參數:
    * `advertisement_id` (Path): String，廣告 ID，必填。
* 請求主體:
    * Content-Type: `application/json`
    * Schema:
```json
{
  "type": "object",
  "properties": {
    "approved": {
      "type": "boolean",
      "description": "審核結果，true 表示批准，false 表示拒絕",
      "example": true
    },
     "reason": {
      "type": "string",
      "description": "拒絕的原因",
      "example": "廣告內容不符合規定"
    }
  },
  "required": [
    "approved"
  ]
}
```
* 範例
```json
{
  "approved": true
}
```
或
```json
{
  "approved": false,
  "reason": "廣告內容不符合規定"
}
```
* 回應:
  * 204 No Content: 審核成功
  * 400 Bad Request: 請求錯誤。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)
        *   範例: (同 3.1 建立預約 的 400 回應)
  * 404 Not Found: 找不到廣告
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)
        *   範例: (同 3.1 建立預約 的 400 回應)
  * 500 Server Error: 伺服器錯誤。
        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)
        *   範例: (同 3.1 建立預約 的 500 回應)
*  業務邏輯：
   1. 驗證API 金鑰或 JWT，並驗證使用者具有管理員權限。
   2. 從URL路徑中獲取 `advertisement_id`。
   3. 從請求主體獲取 `approved` 和 `reason` （如果拒絕）。
   4. 驗證廣告是否存在。
   5. 如果 `approved` 是 true，將廣告狀態更新為 “已批准”。如果 `approved` 是 false，將廣告狀態更新為 “已拒絕”，並記錄拒絕原因。
   6. 返回 204 No Content 表示成功。
   7. 如果有任何錯誤，返回相應的錯誤碼和訊息。
* 安全性考量：
    * 驗證 API 金鑰或 JWT，確保只有管理員可以進行操作。
    * 防止 SQL 注入和 Cypher 注入攻擊。
* 備註：
    * 此API需要後台管理介面調用，前端使用者不能直接調用。


### 5. 使用者關係管理 (User Relationship Management)

#### 5.1 建立使用者關係 (Create User Relationship)

*   端點名稱: `Create User Relationship`
*   描述: 建立兩個使用者之間的關係 (例如：朋友、追蹤、封鎖)。
*   HTTP 方法: `POST`
*   URL 路徑: `/user_relationships`
*   請求參數: 無
*   請求主體:

    *   Content-Type: `application/json`
    *   Schema:

```json
{
  "type": "object",
  "properties": {
    "user_id_1": {
      "type": "string",
      "format": "uuid",
      "description": "使用者 1 ID",
      "example": "9abcdef0-1234-5678-90ab-cdef12345678"
    },
    "user_id_2": {
      "type": "string",
      "format": "uuid",
      "description": "使用者 2 ID",
      "example": "abcdef01-2345-6789-0abc-def123456789"
    },
    "relationship_type": {
      "type": "string",
      "description": "關係類型 (friend, follow, block)",
      "example": "friend"
    }
  },
  "required": [
    "user_id_1",
    "user_id_2",
    "relationship_type"
  ]
}
```

    *   範例:

```json
{
  "user_id_1": "9abcdef0-1234-5678-90ab-cdef12345678",
  "user_id_2": "abcdef01-2345-6789-0abc-def123456789",
  "relationship_type": "friend"
}
```

*   回應:

    *   201 Created: 使用者關係建立成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "user_relationship_id": {
      "type": "string",
      "format": "uuid",
      "description": "新建立的使用者關係 ID",
      "example": "bcdef012-3456-7890-abcd-ef1234567890"
    }
  },
  "required": [
    "user_relationship_id"
  ]
}
```

        *   範例:

```json
{
  "user_relationship_id": "bcdef012-3456-7890-abcd-ef1234567890"
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從請求主體中獲取 `user_id_1`、`user_id_2` 和 `relationship_type`。
    3.  驗證 `user_id_1` 和 `user_id_2` 是否存在於資料庫中。
    4.  驗證 `relationship_type` 是否為允許的值之一 (friend, follow, block)。
    5.  檢查兩個使用者之間是否已存在關係。
    6.  建立新的使用者關係記錄，並生成 `user_relationship_id`。
    7.  將 `user_relationship_id` 返回給客戶端。
    8.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權建立與另一個使用者的關係。

#### 5.2 取得使用者關係 (Get User Relationship)

*   端點名稱: `Get User Relationship`
*   描述: 取得指定兩個使用者之間的關係。
*   HTTP 方法: `GET`
*   URL 路徑: `/user_relationships`
*   請求參數:

    *   `user_id_1` (Query): String，使用者 1 ID，必填。
    *   `user_id_2` (Query): String，使用者 2 ID，必填。

*   請求主體: 無
*   回應:

    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "user_relationship_id": {
      "type": "string",
      "format": "uuid",
      "description": "使用者關係 ID",
      "example": "bcdef012-3456-7890-abcd-ef1234567890"
    },
    "user_id_1": {
      "type": "string",
      "format": "uuid",
      "description": "使用者 1 ID",
      "example": "9abcdef0-1234-5678-90ab-cdef12345678"
    },
    "user_id_2": {
      "type": "string",
      "format": "uuid",
      "description": "使用者 2 ID",
      "example": "abcdef01-2345-6789-0abc-def123456789"
    },
    "relationship_type": {
      "type": "string",
      "description": "關係類型 (friend, follow, block)",
      "example": "friend"
    }
  },
  "required": [
    "user_relationship_id",
    "user_id_1",
    "user_id_2",
    "relationship_type"
  ]
}
```

        *   範例:

```json
{
  "user_relationship_id": "bcdef012-3456-7890-abcd-ef1234567890",
  "user_id_1": "9abcdef0-1234-5678-90ab-cdef12345678",
  "user_id_2": "abcdef01-2345-6789-0abc-def123456789",
  "relationship_type": "friend"
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到使用者關係。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從查詢參數中獲取 `user_id_1` 和 `user_id_2`。
    3.  驗證 `user_id_1` 和 `user_id_2` 是否存在於資料庫中。
    4.  查詢資料庫，獲取指定兩個使用者之間的關係
    5.  將使用者關係資訊返回給客戶端。
    6.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權查詢兩個使用者之間的關係。

#### 5.3 更新使用者關係 (Update User Relationship)

*   端點名稱: `Update User Relationship`
*   描述: 更新指定兩個使用者之間的關係。
*   HTTP 方法: `PUT`
*   URL 路徑: `/user_relationships`
*   請求參數:

    *   `user_id_1` (Query): String，使用者 1 ID，必填。
    *   `user_id_2` (Query): String，使用者 2 ID，必填。

*   請求主體:

    *   Content-Type: `application/json`
    *   Schema:

```json
{
  "type": "object",
  "properties": {
    "relationship_type": {
      "type": "string",
      "description": "關係類型 (friend, follow, block)",
      "example": "block"
    }
  },
  "required": [
    "relationship_type"
  ]
}
```

    *   範例:

```json
{
  "relationship_type": "block"
}
```

*   回應:

    *   204 No Content: 更新成功。

        *   沒有回應主體。

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到使用者關係。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從查詢參數中獲取 `user_id_1` 和 `user_id_2`。
    3.  驗證 `user_id_1` 和 `user_id_2` 是否存在於資料庫中。
    4.  從請求主體中獲取要更新的 `relationship_type`。
    5.  驗證 `relationship_type` 是否為允許的值之一 (friend, follow, block)。
    6.  更新資料庫中指定兩個使用者的關係。
    7.  如果成功更新使用者關係，返回 204 No Content。
    8.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權更新與另一個使用者的關係。

#### 5.4 刪除使用者關係 (Delete User Relationship)

*   端點名稱: `Delete User Relationship`
*   描述: 刪除指定兩個使用者之間的關係。
*   HTTP 方法: `DELETE`
*   URL 路徑: `/user_relationships`
*   請求參數:

    *   `user_id_1` (Query): String，使用者 1 ID，必填。
    *   `user_id_2` (Query): String，使用者 2 ID，必填。

*   請求主體: 無
*   回應:

    *   204 No Content: 刪除成功。

        *   沒有回應主體。

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
    *   404 Not Found: 找不到使用者關係。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從查詢參數中獲取 `user_id_1` 和 `user_id_2`。
    3.  驗證 `user_id_1` 和 `user_id_2` 是否存在於資料庫中。
    4.  刪除資料庫中指定兩個使用者的關係。
    5.  如果成功刪除使用者關係，返回 204 No Content。
    6.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權刪除兩個使用者之間的關係。

#### 5.5 查詢使用者關係列表 (List User Relationships)

*   端點名稱: `List User Relationships`
*   描述: 查詢指定使用者的關係列表 (例如：朋友列表、追蹤列表、粉絲列表、黑名單)。
*   HTTP 方法: `GET`
*   URL 路徑: `/users/{user_id}/relationships`
*   請求參數:

    *   `user_id` (Path): String，使用者 ID，必填。
    *   `relationship_type` (Query): String，關係類型 (friend, follow, follower, block)，選填，如果指定，則只返回該類型的關係。
    *   `limit` (Query): Integer，每頁返回的使用者數量，選填，預設值為 10。
    *   `offset` (Query): Integer，偏移量，用於分頁，選填，預設值為 0。

*   請求主體: 無
*   回應:

    *   200 OK: 查詢成功。

        *   Content-Type: `application/json`
        *   Schema:

```json
{
  "type": "object",
  "properties": {
    "total": {
      "type": "integer",
      "description": "符合條件的使用者關係總數",
      "example": 50
    },
    "users": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "user_id": {
            "type": "string",
            "format": "uuid",
            "description": "使用者 ID",
            "example": "abcdef01-2345-6789-0abc-def123456789"
          },
          "user_name": {
            "type": "string",
            "description": "使用者名稱",
            "example": "李四"
          }
        },
        "required": [
          "user_id",
          "user_name"
        ]
      }
    },
  "required":[
    "total",
    "users"
  ]
  }
}
```

        *   範例:

```json
{
  "total": 50,
  "users": [
    {
      "user_id": "abcdef01-2345-6789-0abc-def123456789",
      "user_name": "李四"
    },
    {
      "user_id": "bcdef012-3456-7890-abcd-ef1234567890",
      "user_name": "王五"
    }
  ]
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 500 回應)

*   業務邏輯:

    1.  驗證 API 金鑰或 JWT。
    2.  從 URL 路徑中獲取 `user_id`。
    3.  從查詢參數中獲取 `relationship_type`、`limit` 和 `offset`。
    4.  驗證 `user_id` 是否存在於資料庫中。
    5.  驗證 `relationship_type` 是否為允許的值之一 (friend, follow, follower, block)。
    6.  查詢資料庫，獲取指定使用者的關係列表，並計算總數。
        *   如果指定了 `relationship_type`，則只返回該類型的關係。
        *   如果查詢 `follower`，則需要反向查詢 `user_id_2` 是指定 `user_id` 的關係。
    7.  將使用者列表和總數返回給客戶端。
    8.  如果發生任何錯誤，返回相應的錯誤碼和錯誤訊息。

*   安全性考量:

    *   驗證 API 金鑰或 JWT。
    *   防止 SQL 注入攻擊和 Cypher 注入攻擊。
    *   驗證使用者是否有權查詢該使用者的關係資訊。

#### 5.6 取得使用者列表 (Get User List suitable for advertisement)

* 端點名稱: `Get User List suitable for advertisement`
* 描述: 根據廣告的目標受眾條件，獲取適合發送廣告的使用者列表。
* HTTP 方法: `GET`
* URL 路徑: `/users/suitable_for_advertisement`

* 請求參數:
    *   `business_id` (Query): String，商家 ID，必填。
    *   `advertisement_target_audience` (Query): String，目標受眾的條件，JSON 格式，必填。
    *   `limit` (Query): Integer，每頁返回的使用者數量，選填，預設值為 10。
    *   `offset` (Query): Integer，偏移量，用於分頁，選填，預設值為 0。
* 請求主體: 無

* 回應:
```json
{
  "type": "object",
  "properties": {
    "total": {
      "type": "integer",
      "description": "符合條件的使用者總數",
      "example": 50
    },
    "users": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "user_id": {
            "type": "string",
            "format": "uuid",
            "description": "使用者 ID",
            "example": "abcdef01-2345-6789-0abc-def123456789"
          },
          "user_name": {
            "type": "string",
            "description": "使用者名稱",
            "example": "李四"
          },
            "customer_phone": {
            "type": "string",
            "description": "顧客電話",
            "example": "0912345678"
          }
        },
        "required": [
          "user_id",
          "user_name"
        ]
      }
    },
    "required": [
      "total",
      "users"
    ]
  }
}
```

        *   範例:

```json
{
  "total": 50,
  "users": [
    {
      "user_id": "abcdef01-2345-6789-0abc-def123456789",
      "user_name": "李四",
      "customer_phone": "0912345678"
    },
    {
      "user_id": "bcdef012-3456-7890-abcd-ef1234567890",
      "user_name": "王五",
      "customer_phone": "0922334455"
    }
  ]
}
```

    *   400 Bad Request: 請求錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 400 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)

    *   500 Server Error: 伺服器錯誤。

        *   Content-Type: `application/json`
        *   Schema: (同 3.1 建立預約 的 500 回應)

        *   範例: (同 3.1 建立預約 的 400 回應)
* 業務邏輯

   1. 驗證 API 金鑰或 JWT。
   2. 從請求參數中獲取 `business_id`、 `advertisement_target_audience`、 `limit` 和 `offset`。
   3. 驗證 `business_id` 是否存在於資料庫中。
   4. 驗證 `advertisement_target_audience` 是一個有效的 JSON 物件，並且包含有效的目標受眾條件 (例如，gender, age_min, age_max)。
   5. 查詢資料庫，獲取符合目標受眾條件的使用者列表，並計算總數。
      * 目標受眾條件應該與使用者資料中的欄位進行匹配。
   6. 返回符合條件的使用者列表和總數。
   7. 如果有任何錯誤，返回相應的錯誤碼和訊息。
* 安全性考量：
    * 驗證 API 金鑰或 JWT。
    * 防止 SQL 注入和 Cypher 注入攻擊。
    * 驗證請求者是否有權獲取使用者資料。


