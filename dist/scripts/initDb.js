"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 数据库初始化脚本
 * 仅在首次部署或数据库结构变更时运行
 */
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../db");
const databaseSetup_1 = require("../utils/databaseSetup");
// 加载环境变量
dotenv_1.default.config();
async function initializeDb() {
    try {
        console.error('===== 数据库初始化工具 =====');
        console.error('此工具用于创建所有必要的数据库索引和约束');
        console.error('注意: 此操作仅需在首次部署或数据库结构变更时执行');
        // 检查必要的环境变量
        const requiredEnvVars = ['NEO4J_URI', 'NEO4J_USERNAME', 'NEO4J_PASSWORD'];
        const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingEnvVars.length > 0) {
            console.error(`错误: 缺少必要的环境变量: ${missingEnvVars.join(', ')}`);
            console.error('请确保 .env 文件包含所有必要的环境变量');
            process.exit(1);
        }
        // 连接到数据库
        console.error('正在连接到 Neo4j 数据库...');
        try {
            await db_1.neo4jClient.connect();
            console.error('已成功连接到 Neo4j 数据库');
        }
        catch (error) {
            console.error('Neo4j 数据库连接失败:', error);
            process.exit(1);
        }
        // 设置数据库约束和索引
        console.error('正在创建数据库索引和约束...');
        try {
            await (0, databaseSetup_1.setupDatabaseConstraints)();
            console.error('数据库索引和约束创建成功');
        }
        catch (error) {
            console.error('创建数据库索引和约束时发生错误:', error);
            process.exit(1);
        }
        console.error('数据库初始化完成');
    }
    catch (error) {
        console.error('初始化数据库时发生错误:', error);
        process.exit(1);
    }
    finally {
        // 关闭数据库连接
        try {
            await db_1.neo4jClient.close();
            console.error('已关闭数据库连接');
        }
        catch (closeError) {
            console.error('关闭数据库连接时发生错误:', closeError);
        }
    }
}
// 执行初始化
initializeDb();
