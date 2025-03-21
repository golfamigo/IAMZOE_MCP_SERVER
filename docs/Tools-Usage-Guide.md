# IAMZOE MCP 伺服器工具使用指南

此文檔自動生成於 2025-03-21T04:17:22.280Z

## 目錄

1. [createAdvertisement](#createadvertisement) - 建立新的廣告
2. [approveAdvertisement](#approveadvertisement) - 審核待審核的廣告，設置為批准或拒絕
3. [updateAdvertisementStatus](#updateadvertisementstatus) - 更新廣告的狀態（例如從已批准更新為活躍）
4. [getBookings](#getbookings) - 獲取商家的預約列表
5. [createBooking](#createbooking) - 創建新的預約
6. [cancelBooking](#cancelbooking) - 取消已存在的預約
7. [getBusinessHours](#getbusinesshours) - 獲取商家營業時間
8. [createBusiness](#createbusiness) - 建立新的商家
9. [createCategory](#createcategory) - 創建新的商品或服務類別
10. [createCustomer](#createcustomer) - 建立新的顧客資料
11. [getCustomer](#getcustomer) - 獲取單一顧客的詳細資料
12. [listTools](#listtools) - 列出所有可用的工具及其描述
13. [createMembershipLevel](#createmembershiplevel) - 建立新的會員等級
14. [getMembershipLevel](#getmembershiplevel) - 獲取會員等級詳細資訊
15. [assignMembershipLevel](#assignmembershiplevel) - 將客戶指派到特定的會員等級
16. [createNotification](#createnotification) - 創建新的系統通知
17. [createService](#createservice) - 創建新的服務項目
18. [getService](#getservice) - 獲取服務項目詳細資訊
19. [getAvailableSlots](#getavailableslots) - 獲取服務的可用時間段
20. [createStaff](#createstaff) - 建立新員工記錄
21. [getStaff](#getstaff) - 獲取員工資訊
22. [addStaffAvailability](#addstaffavailability) - 設定員工工作可用時段
23. [assignServiceToStaff](#assignservicetostaff) - 將服務項目指派給員工提供
24. [createSubscription](#createsubscription) - 創建定期預約訂閱
25. [createUserRelationship](#createuserrelationship) - 創建使用者之間的關係
26. [getUserRelationship](#getuserrelationship) - 獲取兩個使用者之間的關係
27. [createUser](#createuser) - 創建新的使用者
28. [getSuitableUsersForAdvertisement](#getsuitableusersforadvertisement) - 獲取符合廣告目標受眾條件的使用者

## 工具詳細說明

### createAdvertisement

**描述:** 建立新的廣告

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `business_id` | string | 是 | 商家 ID |
| `advertisement_name` | string | 是 | 廣告名稱 |
| `advertisement_description` | string | 是 | 廣告描述 |
| `advertisement_image_url` | string | 否 | 廣告圖片 URL |
| `advertisement_landing_page_url` | string | 否 | 廣告著陸頁 URL |
| `advertisement_start_date` | string | 是 | 廣告開始日期，ISO 8601 格式 |
| `advertisement_end_date` | string | 是 | 廣告結束日期，ISO 8601 格式 |
| `advertisement_budget` | number | 是 | 廣告預算 |
| `advertisement_target_audience` | string | 否 | 目標受眾描述 |

**示例:**

```json
{
  "name": "createAdvertisement",
  "arguments": {
  "business_id": "00000000-0000-0000-0000-000000000000",
  "advertisement_name": "範例文字",
  "advertisement_description": "範例文字",
  "advertisement_image_url": "https://example.com/sample",
  "advertisement_landing_page_url": "https://example.com/sample",
  "advertisement_start_date": "2025-01-01",
  "advertisement_end_date": "2025-01-01",
  "advertisement_budget": 100,
  "advertisement_target_audience": "範例文字"
}
}
```

**注意事項:**
- 必須提供參數: `business_id`, `advertisement_name`, `advertisement_description`, `advertisement_start_date`, `advertisement_end_date`, `advertisement_budget`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### approveAdvertisement

**描述:** 審核待審核的廣告，設置為批准或拒絕

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `advertisement_id` | string | 是 | 廣告 ID |
| `approved` | boolean | 是 | 是否批准 |
| `reason` | string | 否 | 拒絕原因（當 approved 為 false 時） |

**示例:**

```json
{
  "name": "approveAdvertisement",
  "arguments": {
  "advertisement_id": "00000000-0000-0000-0000-000000000000",
  "approved": true,
  "reason": "範例文字"
}
}
```

**注意事項:**
- 必須提供參數: `advertisement_id`, `approved`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### updateAdvertisementStatus

**描述:** 更新廣告的狀態（例如從已批准更新為活躍）

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `advertisement_id` | string | 是 | 廣告 ID |
| `status` | string (active, completed) | 是 | 新狀態 |

**示例:**

```json
{
  "name": "updateAdvertisementStatus",
  "arguments": {
  "advertisement_id": "00000000-0000-0000-0000-000000000000",
  "status": "active"
}
}
```

**注意事項:**
- 必須提供參數: `advertisement_id`, `status`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### getBookings

**描述:** 獲取商家的預約列表

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `business_id` | string | 是 | 商家 ID |

**示例:**

```json
{
  "name": "getBookings",
  "arguments": {
  "business_id": "00000000-0000-0000-0000-000000000000"
}
}
```

**注意事項:**
- 必須提供參數: `business_id`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### createBooking

**描述:** 創建新的預約

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `business_id` | string | 是 | 商家 ID |
| `customer_profile_id` | string | 是 | 客戶資料 ID |
| `bookable_item_id` | string | 是 | 可預約項目 ID |
| `start_datetime` | string | 是 | 預約開始時間，ISO 8601 格式 |
| `end_datetime` | string | 是 | 預約結束時間，ISO 8601 格式 |
| `unit_count` | number | 是 | 預約單位數量 |

**示例:**

```json
{
  "name": "createBooking",
  "arguments": {
  "business_id": "00000000-0000-0000-0000-000000000000",
  "customer_profile_id": "00000000-0000-0000-0000-000000000000",
  "bookable_item_id": "00000000-0000-0000-0000-000000000000",
  "start_datetime": "2025-01-01",
  "end_datetime": "2025-01-01",
  "unit_count": 1
}
}
```

**注意事項:**
- 必須提供參數: `business_id`, `customer_profile_id`, `bookable_item_id`, `start_datetime`, `end_datetime`, `unit_count`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### cancelBooking

**描述:** 取消已存在的預約

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `booking_id` | string | 是 | 預約 ID |
| `cancellation_reason` | string | 否 | 取消原因（可選） |

**示例:**

```json
{
  "name": "cancelBooking",
  "arguments": {
  "booking_id": "00000000-0000-0000-0000-000000000000",
  "cancellation_reason": "範例文字"
}
}
```

**注意事項:**
- 必須提供參數: `booking_id`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### getBusinessHours

**描述:** 獲取商家營業時間

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `business_id` | string | 是 | 商家 ID |
| `day_of_week` | number | 否 | 星期幾 (0-6，0表示星期日) |

**示例:**

```json
{
  "name": "getBusinessHours",
  "arguments": {
  "business_id": "00000000-0000-0000-0000-000000000000",
  "day_of_week": 1
}
}
```

**注意事項:**
- 必須提供參數: `business_id`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### createBusiness

**描述:** 建立新的商家

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `business_name` | string | 是 | 商家名稱 |
| `business_type` | string | 是 | 商家類型 |
| `business_address` | string | 否 | 商家地址（可選） |
| `business_phone` | string | 否 | 商家電話號碼（可選） |
| `business_email` | string | 否 | 商家電子郵件（可選） |
| `business_description` | string | 否 | 商家描述（可選） |

**示例:**

```json
{
  "name": "createBusiness",
  "arguments": {
  "business_name": "範例文字",
  "business_type": "範例文字",
  "business_address": "範例文字",
  "business_phone": "+123456789",
  "business_email": "user@example.com",
  "business_description": "範例文字"
}
}
```

**注意事項:**
- 必須提供參數: `business_name`, `business_type`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### createCategory

**描述:** 創建新的商品或服務類別

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `business_id` | string | 是 | 商家 ID |
| `category_name` | string | 是 | 類別名稱 |
| `category_description` | string | 否 | 類別描述 |

**示例:**

```json
{
  "name": "createCategory",
  "arguments": {
  "business_id": "00000000-0000-0000-0000-000000000000",
  "category_name": "範例文字",
  "category_description": "範例文字"
}
}
```

**注意事項:**
- 必須提供參數: `business_id`, `category_name`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### createCustomer

**描述:** 建立新的顧客資料

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `business_id` | string | 是 | 商家 ID |
| `customer_name` | string | 是 | 顧客姓名 |
| `customer_email` | string | 是 | 顧客電子郵件 |
| `customer_phone` | string | 否 | 顧客電話號碼（可選） |
| `customer_birthdate` | string | 否 | 顧客生日，ISO 8601 格式（可選） |
| `gender` | string (male, female, other, prefer_not_to_say) | 否 | 性別（可選） |

**示例:**

```json
{
  "name": "createCustomer",
  "arguments": {
  "business_id": "00000000-0000-0000-0000-000000000000",
  "customer_name": "範例文字",
  "customer_email": "user@example.com",
  "customer_phone": "+123456789",
  "customer_birthdate": "2025-01-01",
  "gender": "male"
}
}
```

**注意事項:**
- 必須提供參數: `business_id`, `customer_name`, `customer_email`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### getCustomer

**描述:** 獲取單一顧客的詳細資料

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `customer_profile_id` | string | 是 | 顧客資料 ID |

**示例:**

```json
{
  "name": "getCustomer",
  "arguments": {
  "customer_profile_id": "00000000-0000-0000-0000-000000000000"
}
}
```

**注意事項:**
- 必須提供參數: `customer_profile_id`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### listTools

**描述:** 列出所有可用的工具及其描述

**輸入參數:**

無參數


**示例:**

```json
{
  "name": "listTools",
  "arguments": {}
}
```

**注意事項:**
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### createMembershipLevel

**描述:** 建立新的會員等級

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `business_id` | string | 是 | 商家 ID |
| `membership_level_name` | string | 是 | 會員等級名稱 |
| `membership_level_description` | string | 否 | 會員等級描述 |
| `membership_level_benefits` | string | 否 | 會員等級權益說明 |

**示例:**

```json
{
  "name": "createMembershipLevel",
  "arguments": {
  "business_id": "00000000-0000-0000-0000-000000000000",
  "membership_level_name": "範例文字",
  "membership_level_description": "範例文字",
  "membership_level_benefits": "範例文字"
}
}
```

**注意事項:**
- 必須提供參數: `business_id`, `membership_level_name`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### getMembershipLevel

**描述:** 獲取會員等級詳細資訊

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `membership_level_id` | string | 是 | 會員等級 ID |

**示例:**

```json
{
  "name": "getMembershipLevel",
  "arguments": {
  "membership_level_id": "00000000-0000-0000-0000-000000000000"
}
}
```

**注意事項:**
- 必須提供參數: `membership_level_id`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### assignMembershipLevel

**描述:** 將客戶指派到特定的會員等級

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `customer_profile_id` | string | 是 | 客戶資料 ID |
| `membership_level_id` | string | 是 | 會員等級 ID |
| `membership_start_date` | string | 否 | 會員開始日期 (ISO 格式，如 2025-01-01)，預設為當前日期 |
| `membership_expiry_date` | string | 否 | 會員到期日期 (ISO 格式)，若未提供則表示永久會員 |

**示例:**

```json
{
  "name": "assignMembershipLevel",
  "arguments": {
  "customer_profile_id": "00000000-0000-0000-0000-000000000000",
  "membership_level_id": "00000000-0000-0000-0000-000000000000",
  "membership_start_date": "2025-01-01",
  "membership_expiry_date": "2025-01-01"
}
}
```

**注意事項:**
- 必須提供參數: `customer_profile_id`, `membership_level_id`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### createNotification

**描述:** 創建新的系統通知

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `notification_type` | string | 是 | 通知類型，例如：system, booking, promotion 等 |
| `notification_content` | string | 是 | 通知內容 |
| `business_id` | string | 否 | 商家 ID（可選） |

**示例:**

```json
{
  "name": "createNotification",
  "arguments": {
  "notification_type": "範例文字",
  "notification_content": "範例文字",
  "business_id": "00000000-0000-0000-0000-000000000000"
}
}
```

**注意事項:**
- 必須提供參數: `notification_type`, `notification_content`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### createService

**描述:** 創建新的服務項目

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `business_id` | string | 是 | 商家 ID |
| `bookable_item_type_code` | string | 是 | 可預約項目類型代碼，例如：service, class, resource 等 |
| `bookable_item_name` | string | 是 | 服務名稱 |
| `bookable_item_description` | string | 否 | 服務描述 |
| `bookable_item_duration` | string | 是 | 服務持續時間，例如：30 minutes, 1 hour 等 |
| `bookable_item_price` | number | 否 | 服務價格 |
| `bookable_item_max_capacity` | number | 否 | 最大容量 |
| `category_id` | string | 否 | 類別 ID |

**示例:**

```json
{
  "name": "createService",
  "arguments": {
  "business_id": "00000000-0000-0000-0000-000000000000",
  "bookable_item_type_code": "範例文字",
  "bookable_item_name": "範例文字",
  "bookable_item_description": "範例文字",
  "bookable_item_duration": "範例文字",
  "bookable_item_price": 100,
  "bookable_item_max_capacity": 1,
  "category_id": "00000000-0000-0000-0000-000000000000"
}
}
```

**注意事項:**
- 必須提供參數: `business_id`, `bookable_item_type_code`, `bookable_item_name`, `bookable_item_duration`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### getService

**描述:** 獲取服務項目詳細資訊

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `bookable_item_id` | string | 是 | 可預約項目 ID |

**示例:**

```json
{
  "name": "getService",
  "arguments": {
  "bookable_item_id": "00000000-0000-0000-0000-000000000000"
}
}
```

**注意事項:**
- 必須提供參數: `bookable_item_id`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### getAvailableSlots

**描述:** 獲取服務的可用時間段

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `bookable_item_id` | string | 是 | 可預約項目 ID |
| `start_date` | string | 是 | 開始日期 (YYYY-MM-DD) |
| `end_date` | string | 是 | 結束日期 (YYYY-MM-DD) |

**示例:**

```json
{
  "name": "getAvailableSlots",
  "arguments": {
  "bookable_item_id": "00000000-0000-0000-0000-000000000000",
  "start_date": "2025-01-01",
  "end_date": "2025-01-01"
}
}
```

**注意事項:**
- 必須提供參數: `bookable_item_id`, `start_date`, `end_date`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### createStaff

**描述:** 建立新員工記錄

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `business_id` | string | 是 | 商家 ID |
| `staff_member_name` | string | 是 | 員工姓名 |
| `staff_member_email` | string | 是 | 員工電子郵件地址 |
| `staff_member_phone` | string | 否 | 員工聯絡電話（可選） |
| `staff_member_hire_date` | string | 否 | 員工雇用日期，ISO 8601 格式（可選） |

**示例:**

```json
{
  "name": "createStaff",
  "arguments": {
  "business_id": "00000000-0000-0000-0000-000000000000",
  "staff_member_name": "範例文字",
  "staff_member_email": "user@example.com",
  "staff_member_phone": "+123456789",
  "staff_member_hire_date": "2025-01-01"
}
}
```

**注意事項:**
- 必須提供參數: `business_id`, `staff_member_name`, `staff_member_email`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### getStaff

**描述:** 獲取員工資訊

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `staff_member_id` | string | 是 | 員工 ID |

**示例:**

```json
{
  "name": "getStaff",
  "arguments": {
  "staff_member_id": "00000000-0000-0000-0000-000000000000"
}
}
```

**注意事項:**
- 必須提供參數: `staff_member_id`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### addStaffAvailability

**描述:** 設定員工工作可用時段

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `staff_member_id` | string | 是 | 員工 ID |
| `day_of_week` | number | 是 | 星期幾（0-6，0=週日，1=週一，依此類推） |
| `start_time` | string | 是 | 開始時間，HH:MM:SS 格式 |
| `end_time` | string | 是 | 結束時間，HH:MM:SS 格式 |

**示例:**

```json
{
  "name": "addStaffAvailability",
  "arguments": {
  "staff_member_id": "00000000-0000-0000-0000-000000000000",
  "day_of_week": 1,
  "start_time": "2025-01-01T12:00:00Z",
  "end_time": "2025-01-01T12:00:00Z"
}
}
```

**注意事項:**
- 必須提供參數: `staff_member_id`, `day_of_week`, `start_time`, `end_time`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### assignServiceToStaff

**描述:** 將服務項目指派給員工提供

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `staff_member_id` | string | 是 | 員工 ID |
| `bookable_item_id` | string | 是 | 可預約項目 ID |

**示例:**

```json
{
  "name": "assignServiceToStaff",
  "arguments": {
  "staff_member_id": "00000000-0000-0000-0000-000000000000",
  "bookable_item_id": "00000000-0000-0000-0000-000000000000"
}
}
```

**注意事項:**
- 必須提供參數: `staff_member_id`, `bookable_item_id`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### createSubscription

**描述:** 創建定期預約訂閱

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `customer_profile_id` | string | 是 | 客戶資料 ID |
| `bookable_item_id` | string | 是 | 可預約項目 ID |
| `start_date` | string | 是 | 訂閱開始日期，YYYY-MM-DD 格式 |
| `end_date` | string | 否 | 訂閱結束日期，YYYY-MM-DD 格式（可選，若未提供則表示永久訂閱） |
| `frequency` | string | 是 | 訂閱頻率，例如：daily, weekly, monthly, yearly |
| `time_of_day` | string | 是 | 每次預約的時間，HH:MM:SS 格式 |

**示例:**

```json
{
  "name": "createSubscription",
  "arguments": {
  "customer_profile_id": "00000000-0000-0000-0000-000000000000",
  "bookable_item_id": "00000000-0000-0000-0000-000000000000",
  "start_date": "2025-01-01",
  "end_date": "2025-01-01",
  "frequency": "範例文字",
  "time_of_day": "2025-01-01T12:00:00Z"
}
}
```

**注意事項:**
- 必須提供參數: `customer_profile_id`, `bookable_item_id`, `start_date`, `frequency`, `time_of_day`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### createUserRelationship

**描述:** 創建使用者之間的關係

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `user_id_1` | string | 是 | 第一個使用者 ID |
| `user_id_2` | string | 是 | 第二個使用者 ID |
| `relationship_type` | string | 是 | 關係類型，例如：friend, family, colleague 等 |

**示例:**

```json
{
  "name": "createUserRelationship",
  "arguments": {
  "user_id_1": "00000000-0000-0000-0000-000000000000",
  "user_id_2": "00000000-0000-0000-0000-000000000000",
  "relationship_type": "範例文字"
}
}
```

**注意事項:**
- 必須提供參數: `user_id_1`, `user_id_2`, `relationship_type`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### getUserRelationship

**描述:** 獲取兩個使用者之間的關係

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `user_id_1` | string | 是 | 第一個使用者 ID |
| `user_id_2` | string | 是 | 第二個使用者 ID |

**示例:**

```json
{
  "name": "getUserRelationship",
  "arguments": {
  "user_id_1": "00000000-0000-0000-0000-000000000000",
  "user_id_2": "00000000-0000-0000-0000-000000000000"
}
}
```

**注意事項:**
- 必須提供參數: `user_id_1`, `user_id_2`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### createUser

**描述:** 創建新的使用者

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `user_name` | string | 是 | 使用者名稱 |
| `line_id` | string | 否 | LINE ID |
| `line_notification_enabled` | boolean | 否 | 是否啟用 LINE 通知 |
| `line_language_preference` | string (zh-TW, en-US, ja-JP, ko-KR, zh-CN, th-TH) | 否 | LINE 語言偏好 |
| `email` | string | 是 | 電子郵件 |
| `phone` | string | 否 | 電話號碼 |

**示例:**

```json
{
  "name": "createUser",
  "arguments": {
  "user_name": "範例文字",
  "line_id": "00000000-0000-0000-0000-000000000000",
  "line_notification_enabled": true,
  "line_language_preference": "zh-TW",
  "email": "user@example.com",
  "phone": "+123456789"
}
}
```

**注意事項:**
- 必須提供參數: `user_name`, `email`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

### getSuitableUsersForAdvertisement

**描述:** 獲取符合廣告目標受眾條件的使用者

**輸入參數:**

| 參數名稱 | 類型 | 必填 | 說明 |
| -------- | ---- | ---- | ---- |
| `business_id` | string | 是 | 商家 ID |
| `advertisement_target_audience` | string | 是 | 廣告目標受眾 JSON 字串 |
| `limit` | number | 否 | 結果數量限制 |
| `offset` | number | 否 | 結果偏移量 |

**示例:**

```json
{
  "name": "getSuitableUsersForAdvertisement",
  "arguments": {
  "business_id": "00000000-0000-0000-0000-000000000000",
  "advertisement_target_audience": "範例文字",
  "limit": 1,
  "offset": 1
}
}
```

**注意事項:**
- 必須提供參數: `business_id`, `advertisement_target_audience`
- 可能的錯誤代碼:
  - `InvalidParams`: 當提供的參數不完整或格式錯誤
  - `MethodNotFound`: 當呼叫不存在的工具
  - `InternalError`: 當工具執行過程中發生內部錯誤
  - `BusinessLogicError`: 當違反業務邏輯規則

---

## 附錄

### 錯誤處理

所有工具都支持標準化的錯誤處理，當工具執行失敗時，將返回以下格式的錯誤:

```json
{
  "content": [
    {
      "type": "text",
      "text": "錯誤訊息"
    }
  ],
  "isError": true
}
```

### 常見錯誤代碼

- `InvalidParams`: 當提供的參數不完整或格式錯誤
- `MethodNotFound`: 當呼叫不存在的工具
- `InternalError`: 當工具執行過程中發生內部錯誤
- `BusinessLogicError`: 當違反業務邏輯規則
- `NotFoundError`: 當請求的資源找不到
- `AuthenticationError`: 當認證失敗
- `AuthorizationError`: 當用戶沒有足夠權限

### 類型說明

- 所有 ID 字段應為 UUID 格式字符串
- 日期和時間應使用 ISO 8601 格式 (YYYY-MM-DDTHH:MM:SS.sssZ)
- 布爾值應使用 true 或 false
