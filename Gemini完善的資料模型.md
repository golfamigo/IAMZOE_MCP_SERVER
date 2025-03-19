# Neo4j預約系統資料模型設計文件

## 簡介

本文檔旨在描述 Neo4j 圖形資料庫的資料模型，該資料模型用於支持預約系統的各項功能，包括預約管理、顧客管理、員工管理、服務管理、報表分析等。 該資料模型旨在提供高效的資料查詢和關聯分析能力，並支持 AI Agent 的整合。

## 節點類型 (Node Labels)

### 核心業務實體

- **`:Business`** - 企業節點，代表使用系統的商家。
    - **屬性:**
        - `business_id` (UUID): 唯一識別碼，必填。
        - `business_name` (String): 企業名稱，必填，最大長度 255。
        - `business_timezone` (String): 時區，例如 "Asia/Taipei"、"UTC"，必填。
        - `business_contact_email` (String): 聯絡信箱，選填，需要符合 Email 格式的正則表達式。
        - `business_contact_phone` (String): 聯絡電話，選填，需要符合電話號碼格式的正則表達式。
        - `business_address` (String): 地址，選填，最大長度 255。
        - `business_location` (Point): 地理位置，選填，Point 類型，用於地理位置相關的查詢。
        - `line_destination` (String): LINE ID，選填，用於 LINE Notify 推送。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。
- **`:User`** - 使用者節點，所有用戶的基本資訊。
    - **屬性:**
        - `user_id` (UUID): 唯一識別碼，必填。
        - `user_name` (String): 用戶名稱，必填，最大長度 255。
        - `line_id` (String): LINE ID，選填，用於 LINE Notify 推送。
        - `line_notification_enabled` (Boolean): 是否允許 LINE 通知，預設值為 true，必填。
        - `line_language_preference` (String): 語言偏好，選填，例如 "zh-TW"、"en-US"。
        - `email` (String): 信箱，必填，需要符合 Email 格式的正則表達式。
        - `phone` (String): 電話，選填，需要符合電話號碼格式的正則表達式。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。
- **`:Customer`** - 顧客節點，繼承自 User。
    - **屬性:**
        - `customer_profile_id` (UUID): 唯一識別碼，必填。
        - `customer_name` (String): 顧客姓名，必填，最大長度 255。 (反正規化，與 User 節點的 `user_name` 屬性相同)
        - `customer_email` (String): 顧客 Email，必填，需要符合 Email 格式的正則表達式。 (反正規化，與 User 節點的 `email` 屬性相同)
        - `customer_phone` (String): 顧客電話，選填，需要符合電話號碼格式的正則表達式。 (反正規化，與 User 節點的 `phone` 屬性相同)
        - `customer_birthdate` (Date): 顧客生日，選填。
        - `customer_preferred_language` (String): 顧客偏好的語言，選填，例如 "zh-TW"、"en-US"。
        - `gender` (String): 客戶性別，取值範圍包括 "male"、"female"、"other"，選填。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。
- **`:Staff`** - 員工節點，繼承自 User。
    - **屬性:**
        - `staff_member_id` (UUID): 唯一識別碼，必填。
        - `staff_member_name` (String): 員工姓名，必填，最大長度 255。 (反正規化，與 User 節點的 `user_name` 屬性相同)
        - `staff_member_email` (String): 員工 Email，必填，需要符合 Email 格式的正則表達式。 (反正規化，與 User 節點的 `email` 屬性相同)
        - `staff_member_phone` (String): 員工電話，選填，需要符合電話號碼格式的正則表達式。 (反正規化，與 User 節點的 `phone` 屬性相同)
        - `staff_member_hire_date` (Date): 員工雇用日期，選填。
        - `staff_member_termination_date` (Date): 員工離職日期，選填。
        - `staff_member_is_active` (Boolean): 員工是否啟用，預設值為 true，必填。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。
- **`:BookableItem`** - 可預約項目節點，如服務、資源等。
    - **屬性:**
        - `bookable_item_id` (UUID): 唯一識別碼，必填。
        - `business_id` (UUID): 所屬企業 ID，必填。
        - `bookable_item_type_code` (String): 類型，取值範圍包括 "service"、"resource"、"event"、"teaching"、"table"、"room"，必填。
        - `bookable_item_name` (String): 名稱，必填，最大長度 255。
        - `bookable_item_description` (String): 描述，選填，最大長度 1000。
        - `bookable_item_duration` (Duration): 持續時間，例如 "1 hour"、"30 minutes"，必填。
        - `bookable_item_price` (Number): 價格，選填，最小值 0。
        - `bookable_item_max_capacity` (Integer): 最大容量，選填，最小值 1。
        - `is_active` (Boolean): 是否啟用，預設值為 true，必填。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。
- **`:Booking`** - 預約節點，記錄預約資訊。
    - **屬性:**
        - `booking_id` (UUID): 唯一識別碼，必填。
        - `business_id` (UUID): 所屬企業 ID，必填。
        - `booking_start_datetime` (DateTime): 預約開始時間，必填。
        - `booking_end_datetime` (DateTime): 預約結束時間，必填。
        - `booking_status_code` (String): 狀態，取值範圍包括 "pending"、"confirmed"、"cancelled"、"completed"，必填。
        - `cancellation_reason` (String): 取消原因，選填，最大長度 1000。
        - `booking_unit_count` (Integer): 預約數量，必填，最小值 1。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。
- **`:Category`** - 類別節點，對服務和產品進行分類。
    - **屬性:**
        - `bookable_item_category_id` (UUID): 唯一識別碼，必填。
        - `business_id` (UUID): 所屬企業 ID，必填。
        - `category_name` (String): 類別名稱，必填，最大長度 255。
        - `category_description` (String): 類別描述，選填，最大長度 1000。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。
- **`:MembershipLevel`** - 會員等級節點。
    - **屬性:**
        - `membership_level_id` (UUID): 唯一識別碼，必填。
        - `business_id` (UUID): 所屬企業 ID，必填。
        - `membership_level_name` (String): 會員等級名稱，必填，最大長度 255。
        - `membership_level_description` (String): 會員等級描述，選填，最大長度 1000。
        - `membership_level_benefits` (String): 會員等級福利，選填，最大長度 1000。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。


### 輔助實體

- **`:StaffAvailability`** - 員工可用性節點。
    - **屬性:**
        - `staff_availability_id` (UUID): 唯一識別碼，必填。
        - `staff_member_id` (UUID): 所屬員工 ID，必填。
        - `day_of_week` (Integer): 星期幾，0 (星期日) 到 6 (星期六)，必填。
        - `start_time` (Time): 開始時間，必填。
        - `end_time` (Time): 結束時間，必填。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。
- **`:Notification`** - 通知節點。
    - **屬性:**
        - `notification_id` (UUID): 唯一識別碼，必填。
        - `notification_type` (String): 通知類型，例如 "email"、"sms"、"line"，必填。
        - `notification_content` (String): 通知內容，必填，最大長度 1000。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。
- **`:CustomerAddress`** - 顧客地址節點。
    - **屬性:**
        - `customer_address_id` (UUID): 唯一識別碼，必填。
        - `customer_profile_id` (UUID): 所屬顧客 ID，必填。
        - `address_line1` (String): 地址 1，必填，最大長度 255。
        - `address_line2` (String): 地址 2，選填，最大長度 255。
        - `city` (String): 城市，必填，最大長度 255。
        - `state` (String): 州/省，選填，最大長度 255。
        - `postal_code` (String): 郵遞區號，選填，最大長度 255。
        - `country` (String): 國家，必填，最大長度 255。
        - `is_default_address` (Boolean): 是否為預設地址，預設值為 false，選填。
        - `address_type` (String): 地址用途，取值範圍包括 "billing"、"shipping"、"home"、"work"，選填。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。
- **`:CustomerPhone`** - 顧客電話節點 (如果需要儲存多個電話號碼)。
    - **屬性:**
        - `customer_phone_id` (UUID): 唯一識別碼，必填。
        - `customer_profile_id` (UUID): 所屬顧客 ID，必填。
        - `phone_number` (String): 電話號碼，必填，需要符合電話號碼格式的正則表達式。
        - `phone_type` (String): 電話類型，例如 "home"、"mobile"、"work"，選填。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。
- **`:CustomerNote`** - 顧客筆記節點。
    - **屬性:**
        - `customer_note_id` (UUID): 唯一識別碼，必填。
        - `customer_profile_id` (UUID): 所屬顧客 ID，必填。
        - `staff_member_id` (UUID): 建立筆記的員工 ID，選填。
        - `note_text` (String): 筆記內容，必填，最大長度 1000。
        - `note_timestamp` (DateTime): 筆記時間戳記，由系統自動產生，必填。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。
- **`:Subscription`** - 訂閱節點，處理週期性預約。
    - **屬性:**
        - `subscription_id` (UUID): 唯一識別碼，必填。
        - `customer_profile_id` (UUID): 所屬顧客 ID，必填。
        - `bookable_item_id` (UUID): 訂閱的可預約項目 ID，必填。
        - `start_date` (Date): 訂閱開始日期，必填。
        - `end_date` (Date): 訂閱結束日期，選填，如果為空表示永久訂閱。
        - `frequency` (String): 訂閱頻率，例如 "daily"、"weekly"、"monthly"，必填。
        - `time_of_day` (Time): 訂閱時間，必填。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。

### 系統運維實體 (可選，用於監控和管理系統)

- **`:BusinessStatistics`** - 商業統計節點。
    - **屬性:**
        - `business_statistics_id` (UUID): 唯一識別碼，必填。
        - `business_id` (UUID): 所屬企業 ID，必填。
        - `date` (Date): 統計日期，必填。
        - `total_revenue` (Number): 總收入，必填。
        - `total_bookings` (Integer): 總預約數量，必填。
        - `new_customers` (Integer): 新顧客數量，必填。
        - `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        - `updated_at` (DateTime): 更新時間，由系統自動產生，必填。
- **`:ChangeLog`** - 變更日誌節點。
    - **屬性:**
        - `change_log_id` (UUID): 唯一識別碼，必填。
        - `entity_type` (String): 實體類型，例如 "Customer"、"Booking"，必填。
        - `entity_id` (UUID): 實體 ID，必填。
        - `change_type` (String): 變更類型，例如 "create"、"update"、"delete"，必填。
        - `changed_by` (UUID): 變更者 ID，選填，如果是由系統自動變更，則可以為空。
        - `changed_at` (DateTime): 變更時間，由系統自動產生，必填。
        - `old_value` (String): 舊值，選填，JSON 格式。
        - `new_value` (String): 新值，選填，JSON 格式。
- **`:SyncLog`** - 同步日誌節點。
    - **屬性:**
        - `sync_log_id` (UUID): 唯一識別碼，必填。
        - `source_database` (String): 來源資料庫，例如 "PostgreSQL"，必填。
        - `target_database` (String): 目標資料庫，例如 "Neo4j"，必填。
        - `sync_type` (String): 同步類型，例如 "full"、"incremental"，必填。
        - `synced_at` (DateTime): 同步時間，由系統自動產生，必填。
        - `success` (Boolean): 同步是否成功，必填。
        - `message` (String): 同步訊息，選填，如果同步失敗，則包含錯誤訊息。
- **`:PerformanceMetric`** - 性能指標節點。
    - **屬性:**
        - `performance_metric_id` (UUID): 唯一識別碼，必填。
        - `metric_name` (String): 指標名稱，例如 "API 響應時間"、"資料庫查詢時間"，必填。
        - `metric_value` (Number): 指標值，必填。
        - `measured_at` (DateTime): 測量時間，由系統自動產生，必填。

#### 廣告管理 (Advertisement Management)

*   **`:Advertisement`** - 廣告節點，代表一個經過註冊審核的廣告。
    *   **屬性:**
        -   `advertisement_id` (UUID): 唯一識別碼，必填。
        -   `business_id` (UUID): 所屬商家 ID，必填。
        -   `advertisement_name` (String): 廣告名稱，必填，最大長度 255。
        -   `advertisement_description` (String): 廣告描述，必填，最大長度 1000。
        -   `advertisement_image_url` (String): 廣告圖片 URL，必填，需要符合 URL 格式。
        -   `advertisement_landing_page_url` (String): 廣告落地頁 URL，必填，需要符合 URL 格式。
        -   `advertisement_start_date` (Date): 廣告開始日期，必填。
        -   `advertisement_end_date` (Date): 廣告結束日期，必填。
        -   `advertisement_budget` (Number): 廣告預算，必填，最小值 0。
        -   `advertisement_target_audience` (String): 廣告目標受眾，必填，JSON 格式，儲存目標受眾的條件。
        -   `advertisement_status` (String): 廣告狀態 (pending, approved, rejected, active, completed)，必填，預設值為 `pending`。
        -   `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        -   `updated_at` (DateTime): 更新時間，由系統自動產生，必填。

#### 使用者關係管理 (User Relationship Management)

*   **`:UserRelationship`** - 使用者關係節點，代表兩個使用者之間的關係。
    *   **屬性:**
        -   `user_relationship_id` (UUID): 唯一識別碼，必填。
        -   `user_id_1` (UUID): 使用者 1 ID，必填。
        -   `user_id_2` (UUID): 使用者 2 ID，必填。
        -   `relationship_type` (String): 關係類型 (friend, follow, block)，必填。
        -   `created_at` (DateTime): 建立時間，由系統自動產生，必填。
        -   `updated_at` (DateTime): 更新時間，由系統自動產生，必填。

## 關係類型 (Relationship Types)

### 從屬與擁有關係

- `[:BELONGS_TO]` - (顧客)-[:BELONGS_TO]->(企業)： 表示顧客屬於某個企業。
- `[:WORKS_FOR]` - (員工)-[:WORKS_FOR]->(企業)： 表示員工在某個企業工作。
- `[:HAS_CATEGORY]` - (可預約項目)-[:HAS_CATEGORY]->(類別)： 表示可預約項目屬於某個類別。
- `[:HAS_AVAILABILITY]` - (員工)-[:HAS_AVAILABILITY]->(員工可用性)： 表示員工在某個時間段內可用。
- `[:HAS_ADDRESS]` - (顧客)-[:HAS_ADDRESS]->(顧客地址)： 表示顧客擁有某個地址。
- `[:HAS_PHONE]` - (顧客)-[:HAS_PHONE]->(顧客電話)： 表示顧客擁有某個電話號碼。
- `[:HAS_NOTE]` - (顧客)-[:HAS_NOTE]->(顧客筆記)： 表示顧客擁有某個筆記。
- `[:HAS_MEMBERSHIP]` - (顧客)-[:HAS_MEMBERSHIP]->(會員等級)： 表示顧客擁有某個會員等級。
- `[:HAS_NOTIFICATION]` - (預約)-[:HAS_NOTIFICATION]->(通知)： 表示預約有通知。
- `[:HAS_STATISTICS]` - (企業)-[:HAS_STATISTICS]->(商業統計)： 表示企業擁有某個統計資料。
- `[:HAS_SUBSCRIPTION]` - (顧客)-[:HAS_SUBSCRIPTION]->(訂閱)： 表示顧客訂閱了某項服務。

### 操作與行為關係

- `[:MADE]` - (顧客)-[:MADE]->(預約)： 表示顧客建立了預約。
- `[:BOOKS]` - (預約)-[:BOOKS]->(可預約項目)： 表示預約對應的可預約項目。
- `[:CAN_PROVIDE]` - (員工)-[:CAN_PROVIDE]->(可預約項目)： 表示員工可以提供某項服務。
- `[:ASSIGNED_TO]` - (預約)-[:ASSIGNED_TO]->(員工)： 表示預約分配給某個員工。
- `[:CREATED_NOTE]` - (員工)-[:CREATED_NOTE]->(顧客筆記)： 表示員工建立了筆記。
- `[:RECEIVED_NOTIFICATION]` - (使用者)-[:RECEIVED_NOTIFICATION]->(通知)： 表示使用者接收到通知。
- `[:OFFERS_DISCOUNT]` - (會員等級)-[:OFFERS_DISCOUNT]->(可預約項目)： 表示會員等級提供某項服務的折扣。
- `[:SUBSCRIBES_TO]` - (訂閱)-[:SUBSCRIBES_TO]->(可預約項目)： 表示訂閱訂閱了某項服務。
- `[:PREFERRED_STAFF]` - (訂閱)-[:PREFERRED_STAFF]->(員工)： 表示訂閱偏好的員工。
- `[:CHILD_OF]` - (子類別)-[:CHILD_OF]->(父類別)： 表示子類別屬於父類別。 (用於服務類別分層)

### 廣告管理 (Advertisement Management)

*   `[:HAS_ADVERTISEMENT]` - (商家)-[:HAS_ADVERTISEMENT]->(廣告)： 表示商家擁有某個廣告。

### 使用者關係管理 (User Relationship Management)

*   `[:RELATES_TO]` - (使用者)-[:RELATES_TO]->(使用者)： 表示使用者與另一個使用者之間存在關係。
    *   *這個關係可以加入 `relationship_type` 屬性，用以儲存關係的類型 (friend, follow, block)。*

### 關係屬性

*部分關係可以加上屬性，用以儲存更詳細的資訊。*

- `[:HAS_MEMBERSHIP]`
  * `membership_start_date` (Date): 會員開始日期
  * `membership_expiry_date` (Date): 會員到期日期

## 常用 Cypher 查詢模式

```cypher
// 查詢顧客的所有預約 (按預約開始時間倒序排序)
MATCH (c:Customer {customer_profile_id: $customer_id})-[:MADE]->(b:Booking)
RETURN b
ORDER BY b.booking_start_datetime DESC
```

```cypher
// 查詢員工特定日期的預約
MATCH (s:Staff {staff_member_id: $staff_id})<-[:ASSIGNED_TO]-(b:Booking)
WHERE date(b.booking_start_datetime) = date($date)
RETURN b
ORDER BY b.booking_start_datetime
```

```cypher
// 查詢特定類別下的所有可預約項目
MATCH (cat:Category {bookable_item_category_id: $category_id})<-[:HAS_CATEGORY]-(bi:BookableItem)
WHERE bi.is_active = true
RETURN bi
```

```cypher
// 查詢可用員工與時段 (根據服務 ID 和時間範圍)
MATCH (s:Staff {business_id: $business_id})-[:CAN_PROVIDE]->(bi:BookableItem {bookable_item_id: $service_id})
WHERE s.staff_member_is_active = true
MATCH (s)-[:HAS_AVAILABILITY]->(sa:StaffAvailability)
WHERE sa.day_of_week = dayOfWeek($start_time)  // 檢查星期幾是否符合
  AND sa.start_time <= time($start_time)  // 檢查開始時間是否符合
  AND sa.end_time >= time($end_time)    // 檢查結束時間是否符合
RETURN s, sa
```

```cypher
// 查詢與某個顧客有相似偏好的其他顧客 (根據共同預約的可預約項目數量)
MATCH (c:Customer {customer_profile_id: $customer_id})-[:HAS_BOOKING]->(b:Booking)-[:BOOKS]->(bi:BookableItem)<-[:BOOKS]-(b2:Booking)<-[:MADE]-(c2:Customer)
WHERE c <> c2
WITH c2, count(bi) AS common_items
ORDER BY common_items DESC
LIMIT 10
RETURN c2, common_items
```

```cypher
// 查詢經常一起提供服務的員工 (基於同一個預約)
MATCH (s1:Staff)-[:ASSIGNED_TO]->(b:Booking)<-[:ASSIGNED_TO]-(s2:Staff)
WHERE s1 <> s2
WITH s1, s2, count(b) AS common_bookings
ORDER BY common_bookings DESC
LIMIT 10
RETURN s1, s2, common_bookings
```

```cypher
// 查詢與某個服務相關的其他服務 (基於同一個預約)
MATCH (bi1:BookableItem {bookable_item_id: $service_id})<-[:BOOKS]-(b:Booking)-[:BOOKS]->(bi2:BookableItem)
WHERE bi1 <> bi2
WITH bi2, count(b) AS common_bookings
ORDER BY common_bookings DESC
LIMIT 10
RETURN bi2, common_bookings
```
#### 廣告管理 (Advertisement Management)
```cypher
// 查詢指定商家的所有廣告
MATCH (b:Business {business_id: $business_id})-[:HAS_ADVERTISEMENT]->(a:Advertisement)
RETURN a
```

```cypher
// 查詢指定商家的有效廣告
MATCH (b:Business {business_id: $business_id})-[:HAS_ADVERTISEMENT]->(a:Advertisement)
WHERE a.advertisement_start_date <= date() <= a.advertisement_end_date AND a.advertisement_status = "approved"
RETURN a
```

#### 使用者關係管理 (User Relationship Management)

```cypher
// 查詢指定使用者的朋友列表
MATCH (u:User {user_id: $user_id})-[r:RELATES_TO {relationship_type: "friend"}]->(friend:User)
RETURN friend
```

```cypher
// 查詢指定使用者的粉絲列表 (追蹤者)
MATCH (u:User {user_id: $user_id})<-[r:RELATES_TO {relationship_type: "follow"}]-(follower:User)
RETURN follower
```


## 索引與約束

### 唯一性約束

- `business_id_unique` 於 Business 節點
- `user_id_unique` 於 User 節點
- `booking_id_unique` 於 Booking 節點
- `staff_member_id_unique` 於 Staff 節點
- `customer_profile_id_unique` 於 Customer 節點
- `bookable_item_id_unique` 於 BookableItem 節點

### 重要索引

- `booking_business_status_idx` 於 Booking 節點 (business_id, booking_status_code): 用於加速查詢某個企業下具有特定狀態的預約，包含 business_id 和 booking_status_code 欄位。
- `booking_business_start_idx` 於 Booking 節點 (business_id, booking_start_datetime): 用於加速查詢某個企業在特定時間範圍內的預約，包含 business_id 和 booking_start_datetime 欄位。
- `bookable_item_business_type_idx` 於 BookableItem 節點 (business_id, bookable_item_type_code): 用於加速查詢某個企業下特定類型的可預約項目，包含 business_id 和 bookable_item_type_code 欄位。
- `staff_business_active_idx` 於 Staff 節點 (business_id, staff_member_is_active): 用於加速查詢某個企業下啟用的員工，包含 business_id 和 staff_member_is_active 欄位。
- `customer_name_idx` 於 Customer 節點 (customer_name): 加速姓名搜尋顧客

#### 廣告管理 (Advertisement Management)

*   `advertisement_id_unique` 於 Advertisement 節點
*   `advertisement_business_idx` 於 Advertisement 節點 (business_id): 用於加速查詢某個商家的廣告，包含 business_id 欄位。

#### 使用者關係管理 (User Relationship Management)

*   *可以考慮建立複合索引 (user_id_1, user_id_2, relationship_type)，以加速查詢兩個使用者之間的特定關係。*

## 資料驗證與約束

* *驗證規則應在應用程式層 (MCP Server) 中實作，以確保資料的完整性和一致性。*

* *範例:*
  * `email` 屬性： 使用正規表示式驗證 Email 格式的正確性。
  * `phone` 屬性： 使用正規表示式驗證電話號碼格式的正確性。
  * `bookable_item_price` 屬性： 確保價格不為負數。
  * `booking_start_datetime` 和 `booking_end_datetime` 屬性： 確保開始時間早於結束時間。
  * `Advertisement` 節點
  * `advertisement_start_date` 和 `advertisement_end_date` 屬性： 確保開始日期早於結束日期。
  * `advertisement_target_audience` 屬性： 驗證 JSON 格式的正確性，以及目標受眾條件的有效性。



## 圖形資料庫設計原則

1.  **明確使用方向性關係：** 建議使用方向性關係，以明確表達節點之間的關係。
2.  **避免過度索引：** 過多的索引會降低寫入性能，建議只對常用的查詢欄位建立索引。
3.  **合理使用屬性：** 避免將大量的文字資料儲存在節點屬性中，可以將這些資料儲存在單獨的節點中，並使用關係連接。
4.  **善用標籤：** 善用標籤來對節點進行分類，方便查詢。
5.  **避免過度連接：** 避免單個節點連接過多的節點，可能會降低查詢性能。
6.  **建立多個關係：** 可以在兩個節點之間建立多個關係，以表達不同的關聯。
7.  **考慮讀寫比例：** 根據讀寫比例來選擇合適的資料庫配置和索引策略。
8.  **定期監控和優化：** 定期監控資料庫的性能，並根據實際情況進行優化。

## MCP Server 的特定需求

*   **權限管理：**  如何在圖形資料模型中表示使用者或 AI Agent 的權限？ 如何確保只有授權的使用者或 AI Agent 才能存取特定的資料？
    * *建議： 建立 `:Role` 節點，並使用 `[:HAS_ROLE]` 關係將使用者和角色連接起來。 然後，建立 `:Permission` 節點，並使用 `[:HAS_PERMISSION]` 關係將角色和許可權連接起來。 最後，在查詢中加入許可權檢查，確保使用者具有存取資料的許可權。*
*   **審計日誌：**  如何記錄資料的變更歷史？ 如何追蹤哪個使用者或 AI Agent 進行了哪些操作？
    * *建議： 建立 `:ChangeLog` 節點，並在資料變更時建立新的 `:ChangeLog` 節點，記錄變更的實體類型、實體 ID、變更類型、變更者 ID、變更時間、舊值和新值。*
*   **資料同步：**  如何確保關聯式資料庫和圖形資料庫中的資料保持同步？
    * *建議： 使用 ETL 工具或資料庫觸發器來實現資料同步。 也可以使用 Neo4j 的 APOC 庫來從 JDBC 連接的資料庫匯入資料。*
*   **AI Agent 友善：**  如何讓圖形資料模型更容易被 AI Agent 理解和使用？
    * *建議： 使用清晰、簡潔的節點和關係類型名稱。 為每個節點和關係類型提供詳細的描述。 提供一些範例查詢，展示如何使用 Cypher 查詢圖形資料庫。*

## 其他注意事項

*   所有節點都應有適當的標籤 (Labels)
*   使用 UUID 作為唯一識別碼
*   所有節點和關係都應包含 created_at 和 updated_at 屬性
*   日期時間使用 Neo4j 內建的 datetime() 函數
*   地理位置使用 point() 類型
*   關係應有明確的方向性，反映業務邏輯
*   複雜查詢優先使用參數化查詢
*   使用 WITH 子句來支持更複雜的多步查詢




