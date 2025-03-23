"use strict";
/**
 * 内存监控工具
 * 用于监控程序的内存使用情况，及时发现内存泄漏或内存占用过高的问题
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logMemoryUsage = logMemoryUsage;
exports.startMemoryMonitoring = startMemoryMonitoring;
exports.stopMemoryMonitoring = stopMemoryMonitoring;
// 存储历史内存使用记录，用于泄漏侦测
const memoryUsageHistory = [];
const MAX_HISTORY_LENGTH = 10; // 保留最近10次的记录
/**
 * 输出当前程序的内存使用情况
 * @param label 监控点标签，用于标识监控的位置
 */
function logMemoryUsage(label = 'Memory snapshot') {
    try {
        const memUsage = process.memoryUsage();
        const timestamp = Date.now();
        console.error(`[Memory Monitor] ${label}:`);
        console.error(`- RSS (总内存占用): ${formatMemorySize(memUsage.rss)}`);
        console.error(`- 堆总大小: ${formatMemorySize(memUsage.heapTotal)}`);
        console.error(`- 堆已用大小: ${formatMemorySize(memUsage.heapUsed)}`);
        console.error(`- 外部内存: ${formatMemorySize(memUsage.external)}`);
        // 计算堆内存使用率
        const heapUsagePercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        console.error(`- 堆内存使用率: ${heapUsagePercentage.toFixed(2)}%`);
        // 添加警告提示
        if (heapUsagePercentage > 85) {
            console.error(`警告: 堆内存使用率超过 85%，已达到警戒水平`);
        }
        if (memUsage.heapUsed > 1024 * 1024 * 1024) { // 超过1GB
            console.error(`警告: 堆内存使用超过 1GB，可能存在内存泄漏`);
        }
        // 添加到历史记录
        memoryUsageHistory.push({ timestamp, heapUsed: memUsage.heapUsed });
        // 保持历史记录不超过最大限制
        if (memoryUsageHistory.length > MAX_HISTORY_LENGTH) {
            memoryUsageHistory.shift(); // 移除最早的记录
        }
        // 检测内存泄漏
        detectMemoryLeak();
    }
    catch (error) {
        console.error(`[Memory Monitor] 监控内存时发生错误:`, error);
    }
}
/**
 * 开始定期监控内存使用情况
 * @param intervalMs 监控间隔（毫秒），默认为60秒
 * @returns 计时器ID，可用于停止监控
 */
function startMemoryMonitoring(intervalMs = 60000) {
    console.error(`[Memory Monitor] 开始内存监控，间隔: ${intervalMs}ms`);
    // 立即执行一次
    logMemoryUsage('启动时内存快照');
    // 设置定时器定期监控
    return setInterval(() => {
        logMemoryUsage('定期内存快照');
    }, intervalMs);
}
/**
 * 停止内存监控
 * @param monitorId 监控计时器ID
 */
function stopMemoryMonitoring(monitorId) {
    clearInterval(monitorId);
    console.error(`[Memory Monitor] 内存监控已停止`);
}
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
 * 检测内存泄漏
 * 通过分析内存使用趋势来检测可能的内存泄漏
 */
function detectMemoryLeak() {
    // 需要至少有两个数据点来分析趋势
    if (memoryUsageHistory.length < 2) {
        return;
    }
    // 计算最近两次监测的内存增长率
    const latest = memoryUsageHistory[memoryUsageHistory.length - 1];
    const previous = memoryUsageHistory[memoryUsageHistory.length - 2];
    const timeDiff = latest.timestamp - previous.timestamp; // 时间差（毫秒）
    const memoryDiff = latest.heapUsed - previous.heapUsed; // 内存增长（字节）
    // 计算每分钟的内存增长（MB/分钟）
    const growthRatePerMinute = (memoryDiff / (1024 * 1024)) / (timeDiff / 60000);
    // 如果增长率超过一定阈值，可能存在内存泄漏
    if (growthRatePerMinute > 5) { // 每分钟超过5MB的增长率
        console.error(`[内存泄漏警告] 检测到堆内存持续增长: ${growthRatePerMinute.toFixed(2)} MB/分钟`);
        console.error(`[内存泄漏警告] 当前内存使用: ${formatMemorySize(latest.heapUsed)}`);
        console.error(`[内存泄漏警告] 增长量: ${formatMemorySize(memoryDiff)}`);
        console.error(`[内存泄漏警告] 警告: 可能存在内存泄漏，请检查代码中的循环引用或未释放的资源`);
        // 如果想在生产环境中发送通知，可以在这里增加发送通知的代码
    }
    // 分析最早和最近的记录，检测长期内存增长的趋势
    if (memoryUsageHistory.length >= MAX_HISTORY_LENGTH) {
        const oldest = memoryUsageHistory[0];
        const longTimeDiff = latest.timestamp - oldest.timestamp; // 长期时间差（毫秒）
        const longMemoryDiff = latest.heapUsed - oldest.heapUsed; // 长期内存增长（字节）
        // 计算长期内存增长率（MB/小时）
        const longGrowthRatePerHour = (longMemoryDiff / (1024 * 1024)) / (longTimeDiff / 3600000);
        // 如果长期增长率超过一定阈值，警告可能存在慢速内存泄漏
        if (longGrowthRatePerHour > 20) { // 每小时超过20MB的增长率
            console.error(`[内存泄漏警告] 检测到堆内存长期增长: ${longGrowthRatePerHour.toFixed(2)} MB/小时`);
            console.error(`[内存泄漏警告] 警告: 可能存在慢速内存泄漏，建议定期重启或检查长期运行的引用`);
        }
    }
}
