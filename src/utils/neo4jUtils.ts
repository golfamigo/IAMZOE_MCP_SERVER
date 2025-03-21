/**
 * Neo4j 數據類型處理工具函數
 * 提供處理 Neo4j 返回的數據類型的工具函數
 */

/**
 * 將 Neo4j 數值轉換為 JavaScript 數字
 * 處理 Neo4j 整數類型 (帶有 low/high 屬性)
 * 
 * @param neo4jValue Neo4j 返回的數值
 * @returns 轉換後的 JavaScript 數字
 */
export function toJsNumber(neo4jValue: any): number {
  if (!neo4jValue) return 0;
  
  // 處理 Neo4j 整數類型 (帶有 low/high 屬性)
  if (neo4jValue.low !== undefined && neo4jValue.high !== undefined) {
    return Number(neo4jValue.low);
  }
  
  return Number(neo4jValue);
}

/**
 * 將日期轉換為 ISO 格式的日期字符串 (僅日期部分，不包含時間)
 * 
 * @param date 日期對象或日期字符串
 * @returns ISO 格式的日期字符串 (YYYY-MM-DD)
 */
export function toISODateString(date: Date | string): string {
  if (typeof date === 'string') {
    return date.split('T')[0]; // 確保只有日期部分
  }
  return date.toISOString().split('T')[0];
}

/**
 * 將日期時間轉換為 ISO 格式的日期時間字符串
 * 
 * @param dateTime 日期時間對象或日期時間字符串
 * @returns ISO 格式的日期時間字符串
 */
export function toISODateTimeString(dateTime: Date | string): string {
  if (typeof dateTime === 'string') {
    return dateTime;
  }
  return dateTime.toISOString();
}

/**
 * 解析 Neo4j 日期時間對象為 JavaScript Date 對象
 * 
 * @param neo4jDateTime Neo4j 日期時間對象
 * @returns JavaScript Date 對象
 */
export function parseNeo4jDateTime(neo4jDateTime: any): Date {
  if (!neo4jDateTime) return new Date();
  
  // 如果已經是字符串或 Date 對象，直接返回
  if (typeof neo4jDateTime === 'string') {
    return new Date(neo4jDateTime);
  }
  
  if (neo4jDateTime instanceof Date) {
    return neo4jDateTime;
  }
  
  // 處理 Neo4j 日期時間對象
  if (neo4jDateTime.year && neo4jDateTime.month && neo4jDateTime.day) {
    const year = toJsNumber(neo4jDateTime.year);
    const month = toJsNumber(neo4jDateTime.month) - 1; // JavaScript 月份從 0 開始
    const day = toJsNumber(neo4jDateTime.day);
    
    if (neo4jDateTime.hour !== undefined) {
      const hour = toJsNumber(neo4jDateTime.hour);
      const minute = toJsNumber(neo4jDateTime.minute || 0);
      const second = toJsNumber(neo4jDateTime.second || 0);
      const millisecond = toJsNumber(neo4jDateTime.nanosecond || 0) / 1000000;
      
      return new Date(year, month, day, hour, minute, second, millisecond);
    }
    
    return new Date(year, month, day);
  }
  
  // 如果無法解析，返回當前日期
  return new Date();
}

/**
 * 比較兩個日期是否相等 (僅比較日期部分，不比較時間)
 * 
 * @param date1 第一個日期
 * @param date2 第二個日期
 * @returns 是否相等
 */
export function isSameDate(date1: Date | string, date2: Date | string): boolean {
  const dateStr1 = toISODateString(date1);
  const dateStr2 = toISODateString(date2);
  
  return dateStr1 === dateStr2;
}

/**
 * 格式化日期為本地日期字符串
 * 
 * @param date 日期對象或日期字符串
 * @param locale 地區設置，默認為 'zh-TW'
 * @returns 格式化後的日期字符串
 */
export function formatLocalDate(date: Date | string, locale: string = 'zh-TW'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}