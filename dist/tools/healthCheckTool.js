"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.healthCheckImpl = void 0;
/**
 * 健康检查工具
 * 提供一个简单的健康检查接口，可以快速验证MCP服务器是否正常运行
 */
const toolRegistration_1 = require("../utils/toolRegistration");
const db_1 = require("../db");
// 记录服务器启动时间
const SERVER_START_TIME = Date.now();
/**
 * 格式化内存大小为更易读的形式（KB, MB, GB）
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
function formatMemorySize(bytes) {
    if (bytes < 1024) {
        return `${bytes} bytes`;
    }
    else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
    }
    else if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    else {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
}
/**
 * 执行健康检查
 * 返回服务器状态、启动时间、Neo4j连接状态和内存使用情况
 */
const healthCheckImpl = async () => {
    try {
        // 当前时间戳
        const timestamp = new Date().toISOString();
        // 计算服务器运行时间（毫秒）
        const uptime = Date.now() - SERVER_START_TIME;
        // 检查Neo4j连接状态
        const neo4j_connected = db_1.neo4jClient.isConnected();
        // 获取内存使用情况
        const memUsage = process.memoryUsage();
        const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        // 返回健康状态
        return {
            status: 'ok',
            timestamp,
            uptime,
            neo4j_connected,
            memory_usage: {
                rss: formatMemorySize(memUsage.rss),
                heapTotal: formatMemorySize(memUsage.heapTotal),
                heapUsed: formatMemorySize(memUsage.heapUsed),
                external: formatMemorySize(memUsage.external),
                heapUsagePercent: `${heapUsagePercent.toFixed(2)}%`
            },
            version: '1.0.0'
        };
    }
    catch (error) {
        // 即使发生错误，也尝试返回有用的信息
        return {
            status: 'error',
            timestamp: new Date().toISOString(),
            uptime: Date.now() - SERVER_START_TIME,
            neo4j_connected: false,
            memory_usage: {
                rss: 'unknown',
                heapTotal: 'unknown',
                heapUsed: 'unknown',
                external: 'unknown',
                heapUsagePercent: 'unknown'
            },
            version: '1.0.0'
        };
    }
};
exports.healthCheckImpl = healthCheckImpl;
// 创建健康检查工具定义
exports.healthCheck = (0, toolRegistration_1.createToolDefinition)('healthCheck', '检查服务器状态，返回服务器健康状况、运行时间和资源使用情况', {
    type: 'object',
    properties: {},
    required: []
}, exports.healthCheckImpl);
// 导出健康检查工具
exports.default = exports.healthCheck;
