"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startApiServer = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
// 導入路由
const bookings_1 = __importDefault(require("./routes/bookings"));
const customers_1 = __importDefault(require("./routes/customers"));
const staff_1 = __importDefault(require("./routes/staff"));
const services_1 = __importDefault(require("./routes/services"));
const categories_1 = __importDefault(require("./routes/categories"));
const membershipLevels_1 = __importDefault(require("./routes/membershipLevels"));
const advertisements_1 = __importDefault(require("./routes/advertisements"));
const userRelationships_1 = __importDefault(require("./routes/userRelationships"));
const staffAvailability_1 = __importDefault(require("./routes/staffAvailability"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const business_1 = __importDefault(require("./routes/business"));
const users_1 = __importDefault(require("./routes/users"));
const staffService_1 = __importDefault(require("./routes/staffService"));
const businessStatistics_1 = __importDefault(require("./routes/businessStatistics"));
dotenv_1.default.config();
/**
 * 啟動 API 伺服器
 * @returns Express 應用程式實例
 */
const startApiServer = async () => {
    const app = (0, express_1.default)();
    const port = process.env.API_PORT || process.env.PORT || 3000;
    app.use(express_1.default.json());
    // 註冊API路由
    app.use('/api/v1', bookings_1.default);
    app.use('/api/v1', customers_1.default);
    app.use('/api/v1', staff_1.default);
    app.use('/api/v1', services_1.default);
    app.use('/api/v1', categories_1.default);
    app.use('/api/v1', membershipLevels_1.default);
    app.use('/api/v1', advertisements_1.default);
    app.use('/api/v1', userRelationships_1.default);
    app.use('/api/v1', staffAvailability_1.default);
    app.use('/api/v1', notifications_1.default);
    app.use('/api/v1', subscriptions_1.default);
    app.use('/api/v1', business_1.default);
    app.use('/api/v1', users_1.default);
    app.use('/api/v1', staffService_1.default);
    app.use('/api/v1', businessStatistics_1.default);
    // 全域錯誤處理中間件
    app.use((err, req, res, next) => {
        console.error('全域錯誤處理:', err);
        res.status(500).json({
            error_code: 'SERVER_ERROR',
            message: '伺服器發生錯誤',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    });
    // 啟動 Express 應用
    app.listen(port, () => {
        console.error(`API 伺服器監聽於 port ${port}`);
        console.error(`API 基礎路徑: http://localhost:${port}/api/v1`);
    });
    return app;
};
exports.startApiServer = startApiServer;
// 如果直接執行此文件，則啟動 API 伺服器
if (require.main === module) {
    (async () => {
        try {
            // 連接到資料庫
            await db_1.neo4jClient.connect();
            console.error('已連接到 Neo4j 資料庫');
            // 啟動 API 伺服器
            await (0, exports.startApiServer)();
        }
        catch (error) {
            console.error('啟動 API 伺服器時發生錯誤:', error);
            process.exit(1);
        }
    })();
}
