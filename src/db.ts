import neo4j, { Driver, Session, QueryResult } from 'neo4j-driver';

class Neo4jClient {
  private driver: Driver | undefined;

  async connect(): Promise<void> {
    this.driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
    );

    try {
      await this.driver.verifyConnectivity();
      console.error('已成功連接到 Neo4j 資料庫');
    } catch (error) {
      console.error('Neo4j 資料庫連接失敗:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      console.error('已關閉 Neo4j 資料庫連線');
    }
  }

  /**
   * 處理查詢參數，確保數字參數都是整數
   * @param params 查詢參數
   * @returns 處理後的參數
   */
  private processParams(params?: Record<string, any>): Record<string, any> | undefined {
    if (!params) return undefined;
    
    const result: Record<string, any> = {};

    for (const key in params) {
      const value = params[key];
      if (typeof value === 'number') {
        // 確保數值是整數
        result[key] = Number.isInteger(value) ? value : Math.floor(value);
        if (!Number.isInteger(value)) {
          console.error(`自動將參數 ${key} 從 ${value} 轉換為 ${result[key]}`);
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  async runQuery(query: string, params?: Record<string, any>): Promise<QueryResult> {
    if (!this.driver) {
      throw new Error('Neo4j 資料庫未連接');
    }

    // 處理參數中的數值
    const processedParams = this.processParams(params);

    const session: Session = this.driver.session();
    try {
      const result: QueryResult = await session.run(query, processedParams);
      return result;
    } finally {
      await session.close();
    }
  }

  /**
   * 獲取Neo4j驅動實例
   * @returns Neo4j驅動實例
   */
  getDriver(): Driver {
    if (!this.driver) {
      throw new Error('Neo4j 資料庫未連接');
    }
    return this.driver;
  }

  /**
   * 在事務中執行多個查詢
   * @param callback 回調函數，接收事務對象並執行查詢
   * @returns 回調函數的返回值
   */
  async runInTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    if (!this.driver) {
      throw new Error('Neo4j 資料庫未連接');
    }

    const session: Session = this.driver.session();
    try {
      return await session.executeWrite(callback);
    } finally {
      await session.close();
    }
  }
}

export const neo4jClient = new Neo4jClient();