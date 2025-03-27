# IAMZOE 智能預約系統 Neo4j 資料結構

## 節點類型與約束

我們創建了以下主要節點類型並為每個類型設置了ID唯一性約束：

1. **Business**：商家節點
   - 唯一性約束：`business_id`
   - 全文索引：business_name, business_description, business_address

2. **Customer**：顧客節點
   - 唯一性約束：`customer_profile_id`
   - 索引：customer_email, customer_phone, customer_name

3. **Staff**：員工節點
   - 唯一性約束：`staff_member_id`
   - 索引：staff_member_name
   - 全文索引：staff_member_name

4. **Service**：服務節點
   - 唯一性約束：`bookable_item_id`
   - 索引：bookable_item_name
   - 全文索引：bookable_item_name, bookable_item_description

5. **Booking**：預約節點
   - 唯一性約束：`booking_id`
   - 索引：start_datetime (方便日期查詢)

6. **Category**：服務類別節點
   - 唯一性約束：`category_id`

7. **MembershipLevel**：會員等級節點
   - 唯一性約束：`membership_level_id`

8. **LineUser**：LINE用戶節點
   - 唯一性約束：`line_id`

9. **StaffAvailability**：員工可用時段節點

10. **BusinessHours**：營業時間節點

## 關係類型

我們建立了以下主要關係類型來連接各節點：

1. **HAS_CATEGORY**：Business → Category
   - 商家擁有的服務類別

2. **CONTAINS_SERVICE**：Category → Service
   - 類別包含的服務

3. **OFFERS_SERVICE**：Business → Service
   - 商家提供的服務

4. **EMPLOYS**：Business → Staff
   - 商家僱用的員工

5. **CAN_PROVIDE**：Staff → Service
   - 員工可提供的服務

6. **HAS_AVAILABILITY**：Staff → StaffAvailability
   - 員工的可用時段

7. **HAS_CUSTOMER**：Business → Customer
   - 商家的顧客關係

8. **HAS_LINE_ACCOUNT**：Customer → LineUser
   - 顧客關聯的LINE帳戶

9. **OFFERS_MEMBERSHIP**：Business → MembershipLevel
   - 商家提供的會員等級

10. **HAS_MEMBERSHIP**：Customer → MembershipLevel
    - 客戶擁有的會員資格，包含屬性：
    - start_date：開始日期
    - expiry_date：到期日期

11. **HAS_BOOKING**：Customer → Booking
    - 客戶的預約記錄

12. **FOR_SERVICE**：Booking → Service
    - 預約的服務項目

13. **ASSIGNED_TO**：Booking → Staff
    - 預約指派給的員工

14. **HAS_BUSINESS_HOURS**：Business → BusinessHours
    - 商家的營業時間

## 常用查詢模式

以下是根據IAMZOE智能預約助手功能需求設計的常用查詢模式：

### 1. 查詢可用服務

```cypher
// 查詢某商家的所有服務
MATCH (b:Business {business_id: 'biz001'})-[:OFFERS_SERVICE]->(s:Service)
RETURN s.bookable_item_name AS ServiceName, s.bookable_item_description AS Description,
       s.bookable_item_price AS Price, s.bookable_item_duration AS Duration;

// 查詢某類別的所有服務
MATCH (c:Category {category_id: 'cat001'})-[:CONTAINS_SERVICE]->(s:Service)
RETURN c.category_name AS Category, s.bookable_item_name AS Service,
       s.bookable_item_price AS Price, s.bookable_item_duration AS Duration;

// 全文搜索服務
CALL db.index.fulltext.queryNodes("service_search", "剪髮") YIELD node, score
RETURN node.bookable_item_name AS ServiceName, node.bookable_item_description AS Description, score;
```

### 2. 查詢可用時段

```cypher
// 查詢服務的可用時段
MATCH (s:Service {bookable_item_id: 'service001'})<-[:CAN_PROVIDE]-(st:Staff)
MATCH (st)-[:HAS_AVAILABILITY]->(sa:StaffAvailability)
WHERE sa.day_of_week = 1 // 假設週一
RETURN s.bookable_item_name AS Service, st.staff_member_name AS Staff,
       sa.start_time AS StartTime, sa.end_time AS EndTime;

// 查詢某員工的可用時段
MATCH (st:Staff {staff_member_id: 'staff001'})-[:HAS_AVAILABILITY]->(sa:StaffAvailability)
RETURN st.staff_member_name AS Staff, sa.day_of_week AS DayOfWeek,
       sa.start_time AS StartTime, sa.end_time AS EndTime;

// 查詢某日期是否有預約衝突
MATCH (b:Booking)
WHERE b.start_datetime >= '2025-04-01T00:00:00' AND b.start_datetime <= '2025-04-01T23:59:59'
  AND b.booking_status = 'confirmed'
MATCH (b)-[:ASSIGNED_TO]->(st:Staff {staff_member_id: 'staff001'})
RETURN b.start_datetime AS BookingStart, b.end_datetime AS BookingEnd;
```

### 3. 管理預約

```cypher
// 創建新預約
CREATE (b:Booking {
  booking_id: 'book002',
  start_datetime: '2025-04-02T15:00:00',
  end_datetime: '2025-04-02T16:00:00',
  unit_count: 1,
  booking_status: 'confirmed',
  created_at: '2025-03-25T11:30:00'
});

// 關聯預約到客戶、服務和員工
MATCH (c:Customer {customer_profile_id: 'cust001'}), 
      (b:Booking {booking_id: 'book002'}),
      (s:Service {bookable_item_id: 'service001'}),
      (st:Staff {staff_member_id: 'staff001'})
CREATE (c)-[:HAS_BOOKING]->(b)-[:FOR_SERVICE]->(s),
       (b)-[:ASSIGNED_TO]->(st);

// 查詢客戶的所有預約
MATCH (c:Customer {customer_profile_id: 'cust001'})-[:HAS_BOOKING]->(b:Booking)
MATCH (b)-[:FOR_SERVICE]->(s:Service)
MATCH (b)-[:ASSIGNED_TO]->(st:Staff)
RETURN c.customer_name AS Customer, b.booking_id AS BookingID,
       b.start_datetime AS Time, s.bookable_item_name AS Service,
       st.staff_member_name AS Staff, b.booking_status AS Status;

// 修改預約狀態
MATCH (b:Booking {booking_id: 'book001'})
SET b.booking_status = 'cancelled',
    b.updated_at = '2025-03-26T10:00:00'
RETURN b.booking_id, b.booking_status;
```

### 4. 客戶和會員管理

```cypher
// 查詢LINE ID對應的客戶資料
MATCH (l:LineUser {line_id: 'line001'})<-[:HAS_LINE_ACCOUNT]-(c:Customer)
RETURN l.line_id AS LineID, c.customer_name AS CustomerName,
       c.customer_email AS Email, c.customer_phone AS Phone;

// 查詢客戶會員狀態
MATCH (c:Customer {customer_profile_id: 'cust001'})-[r:HAS_MEMBERSHIP]->(m:MembershipLevel)
RETURN c.customer_name AS Customer, m.membership_level_name AS MembershipLevel,
       m.membership_level_benefits AS Benefits, r.start_date AS StartDate,
       r.expiry_date AS ExpiryDate;

// 更新客戶資料
MATCH (c:Customer {customer_profile_id: 'cust001'})
SET c.customer_phone = '0987-123-456',
    c.updated_at = '2025-03-26T10:30:00'
RETURN c.customer_name, c.customer_phone;
```

## 索引和查詢優化

我們為系統中的關鍵節點創建了以下索引以優化查詢性能：

1. **標準索引**
   - Customer: customer_email, customer_phone, customer_name
   - Business: business_name
   - Staff: staff_member_name
   - Service: bookable_item_name
   - Booking: start_datetime

2. **全文搜索索引**
   - service_search: 搜索服務名稱和描述
   - staff_search: 搜索員工姓名
   - business_search: 搜索商家名稱、描述和地址

## LINE與Neo4j互動模式

當用戶通過LINE與IAMZOE智能預約助手對話時，系統的資料流如下：

1. **用戶識別**
   - 系統通過LINE ID查找對應的用戶資料：
   ```cypher
   MATCH (l:LineUser {line_id: $lineId})<-[:HAS_LINE_ACCOUNT]-(c:Customer)
   RETURN c
   ```

2. **服務查詢**
   - 當用戶詢問服務時，系統可以使用全文搜索找到相關服務：
   ```cypher
   CALL db.index.fulltext.queryNodes("service_search", $userQuery) YIELD node
   RETURN node
   ```

3. **預約流程**
   - 當用戶要預約時，系統需要檢查：
     1. 服務是否存在
     2. 指定的員工是否可提供此服務
     3. 指定的時間是否有空檔
     4. 創建預約並建立關係

4. **客戶管理**
   - 查詢、更新客戶資料和會員狀態
   - 查詢客戶的預約歷史

## 結論

這個Neo4j數據模型為IAMZOE智能預約助手提供了堅實的基礎，支持所有需要的功能，包括：
- 服務探索與查詢
- 預約管理（創建、修改、取消）
- 客戶資料管理
- 會員資格管理
- 員工與服務關聯
- 時間與可用性管理

通過明確定義的節點類型、關係和索引，系統可以高效執行複雜查詢，為用戶提供流暢的預約體驗。