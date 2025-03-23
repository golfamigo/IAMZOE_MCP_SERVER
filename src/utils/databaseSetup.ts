// src/utils/databaseSetup.ts

import { neo4jClient } from '../db';
import { toJsNumber } from './neo4jUtils';

/**
 * 建立 Neo4j 數據庫所需的索引和約束
 */
export async function setupDatabaseConstraints(): Promise<void> {
  try {
    console.error('正在建立數據庫索引和約束...');

    // 唯一性約束 - 使用新語法 FOR 和 REQUIRE
    const uniqueConstraints = [
      'CREATE CONSTRAINT IF NOT EXISTS FOR (b:Business) REQUIRE b.business_id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.user_id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (b:Booking) REQUIRE b.booking_id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (s:Staff) REQUIRE s.staff_member_id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (c:Customer) REQUIRE c.customer_profile_id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (b:BookableItem) REQUIRE b.bookable_item_id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (c:Category) REQUIRE c.bookable_item_category_id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (m:MembershipLevel) REQUIRE m.membership_level_id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (a:Advertisement) REQUIRE a.advertisement_id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Notification) REQUIRE n.notification_id IS UNIQUE',
      'CREATE CONSTRAINT IF NOT EXISTS FOR (s:StaffAvailability) REQUIRE s.staff_availability_id IS UNIQUE'
    ];

    for (const constraint of uniqueConstraints) {
      await neo4jClient.runQuery(constraint);
    }

    // 重要索引 - 索引語法保持不變
    const indexes = [
      // 現有索引
      'CREATE INDEX IF NOT EXISTS FOR (b:Booking) ON (b.business_id, b.booking_status_code)',
      'CREATE INDEX IF NOT EXISTS FOR (b:Booking) ON (b.business_id, b.booking_start_datetime)',
      'CREATE INDEX IF NOT EXISTS FOR (b:BookableItem) ON (b.business_id, b.bookable_item_type_code)',
      'CREATE INDEX IF NOT EXISTS FOR (s:Staff) ON (s.business_id, s.staff_member_is_active)',
      'CREATE INDEX IF NOT EXISTS FOR (c:Customer) ON (c.customer_name)',
      'CREATE INDEX IF NOT EXISTS FOR (c:Customer) ON (c.customer_email)',
      'CREATE INDEX IF NOT EXISTS FOR (c:Customer) ON (c.customer_phone)',
      'CREATE INDEX IF NOT EXISTS FOR (a:Advertisement) ON (a.business_id)',
      'CREATE INDEX IF NOT EXISTS FOR (a:Advertisement) ON (a.advertisement_status)',
      'CREATE INDEX IF NOT EXISTS FOR (u:User) ON (u.email)',
      'CREATE INDEX IF NOT EXISTS FOR (u:User) ON (u.user_name)',
      'CREATE INDEX IF NOT EXISTS FOR (sa:StaffAvailability) ON (sa.day_of_week)',
      'CREATE INDEX IF NOT EXISTS FOR (sa:StaffAvailability) ON (sa.staff_member_id)',
      
      // 節點屬性索引（針對沒有唯一性約束的屬性）
      'CREATE INDEX IF NOT EXISTS FOR (bi:BookableItem) ON (bi.bookable_item_name)',
      'CREATE INDEX IF NOT EXISTS FOR (bi:BookableItem) ON (bi.business_id, bi.is_active)',
      'CREATE INDEX IF NOT EXISTS FOR (b:Booking) ON (b.bookable_item_id, b.booking_status_code)',
      'CREATE INDEX IF NOT EXISTS FOR (s:Staff) ON (s.staff_member_email)',
      'CREATE INDEX IF NOT EXISTS FOR (s:Staff) ON (s.staff_member_name)',
      'CREATE INDEX IF NOT EXISTS FOR (c:Customer) ON (c.business_id, c.gender)',
      'CREATE INDEX IF NOT EXISTS FOR (c:Customer) ON (c.customer_birthdate)',
      'CREATE INDEX IF NOT EXISTS FOR (m:MembershipLevel) ON (m.business_id)',
      
      // 複合節點屬性索引（優化查詢）
      'CREATE INDEX IF NOT EXISTS FOR (c:Customer) ON (c.business_id, c.gender, c.customer_birthdate)',
      'CREATE INDEX IF NOT EXISTS FOR (b:Booking) ON (b.business_id, b.booking_status_code, b.booking_start_datetime)',
      'CREATE INDEX IF NOT EXISTS FOR (sa:StaffAvailability) ON (sa.staff_member_id, sa.day_of_week)',
      
      // 節點標籤索引（基礎優化）
      'CREATE INDEX IF NOT EXISTS FOR (b:Business) ON (b.business_id)',
      'CREATE INDEX IF NOT EXISTS FOR (c:Customer) ON (c.customer_profile_id)',
      'CREATE INDEX IF NOT EXISTS FOR (s:Staff) ON (s.staff_member_id)',
      'CREATE INDEX IF NOT EXISTS FOR (bi:BookableItem) ON (bi.bookable_item_id)',
      'CREATE INDEX IF NOT EXISTS FOR (ml:MembershipLevel) ON (ml.membership_level_id)'
    ];

    for (const index of indexes) {
      await neo4jClient.runQuery(index);
    }

    // 關係索引 - 使用社區版兼容的語法
    try {
      // 使用替代語法，為關係屬性創建索引
      const relationshipIndexes = [
        'CREATE INDEX IF NOT EXISTS FOR ()-[r:MADE]-() ON (r.created_at)',
        'CREATE INDEX IF NOT EXISTS FOR ()-[r:BOOKS]-() ON (r.booking_date)',
        'CREATE INDEX IF NOT EXISTS FOR ()-[r:ASSIGNED_TO]-() ON (r.assigned_date)',
        'CREATE INDEX IF NOT EXISTS FOR ()-[r:HAS_MEMBERSHIP]-() ON (r.membership_expiry_date)'
      ];

      for (const index of relationshipIndexes) {
        await neo4jClient.runQuery(index);
      }
      
      // 全文索引（適用於文本搜索）
      const fullTextIndexes = [
        'CREATE FULLTEXT INDEX service_name IF NOT EXISTS FOR (bi:BookableItem) ON EACH [bi.bookable_item_name, bi.bookable_item_description]',
        'CREATE FULLTEXT INDEX customer_search IF NOT EXISTS FOR (c:Customer) ON EACH [c.customer_name, c.customer_email]'
      ];
      
      for (const index of fullTextIndexes) {
        await neo4jClient.runQuery(index);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('關係索引創建失敗，可能需要Neo4j Enterprise版本或不同的語法:', errorMessage);
      console.error('這不會影響系統的基本功能，但可能會影響某些查詢的性能');
    }

    console.error('數據庫索引和約束建立完成');
  } catch (error) {
    console.error('建立數據庫索引和約束時發生錯誤:', error);
    throw error;
  }
}

/**
 * 驗證數據庫連接並執行基本查詢
 */
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    const result = await neo4jClient.runQuery('RETURN 1 as n');
    return result.records.length > 0 && toJsNumber(result.records[0].get('n')) === 1;
  } catch (error) {
    console.error('驗證數據庫連接時發生錯誤:', error);
    return false;
  }
}

/**
 * 初始化數據庫，捕獲並處理可能的錯誤
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const isConnected = await verifyDatabaseConnection();
    if (!isConnected) {
      throw new Error('無法連接到數據庫');
    }
    
    await setupDatabaseConstraints();
    console.error('數據庫初始化成功');
  } catch (error) {
    console.error('初始化數據庫時發生錯誤:', error);
    console.error('應用將繼續啟動，但某些數據庫功能可能不可用');
  }
}