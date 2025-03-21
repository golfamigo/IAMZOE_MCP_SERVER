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

  async runQuery(query: string, params?: Record<string, any>): Promise<QueryResult> {
    if (!this.driver) {
      throw new Error('Neo4j 資料庫未連接');
    }

    const session: Session = this.driver.session();
    try {
      const result: QueryResult = await session.run(query, params);
      return result;
    } finally {
      await session.close();
    }
  }
}

export const neo4jClient = new Neo4jClient();