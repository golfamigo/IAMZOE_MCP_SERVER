"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.neo4jClient = void 0;
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
class Neo4jClient {
    async connect() {
        this.driver = neo4j_driver_1.default.driver(process.env.NEO4J_URI, neo4j_driver_1.default.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD));
        try {
            await this.driver.verifyConnectivity();
            console.error('已成功連接到 Neo4j 資料庫');
        }
        catch (error) {
            console.error('Neo4j 資料庫連接失敗:', error);
            throw error;
        }
    }
    async close() {
        if (this.driver) {
            await this.driver.close();
            console.error('已關閉 Neo4j 資料庫連線');
        }
    }
    async runQuery(query, params) {
        if (!this.driver) {
            throw new Error('Neo4j 資料庫未連接');
        }
        const session = this.driver.session();
        try {
            const result = await session.run(query, params);
            return result;
        }
        finally {
            await session.close();
        }
    }
    /**
     * 獲取Neo4j驅動實例
     * @returns Neo4j驅動實例
     */
    getDriver() {
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
    async runInTransaction(callback) {
        if (!this.driver) {
            throw new Error('Neo4j 資料庫未連接');
        }
        const session = this.driver.session();
        try {
            return await session.executeWrite(callback);
        }
        finally {
            await session.close();
        }
    }
}
exports.neo4jClient = new Neo4jClient();
