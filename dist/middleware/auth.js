"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateApiKey = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.header('X-API-Key');
    if (!apiKey) {
        res.status(401).json({
            error_code: 'UNAUTHORIZED',
            message: '缺少 API Key'
        });
        return;
    }
    // 驗證 API Key 是否匹配環境變數
    const validApiKey = process.env.API_KEY;
    if (apiKey !== validApiKey) {
        res.status(403).json({
            error_code: 'FORBIDDEN',
            message: '無效的 API Key'
        });
        return;
    }
    next();
};
exports.authenticateApiKey = authenticateApiKey;
