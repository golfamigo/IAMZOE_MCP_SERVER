"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advertisementTools = exports.updateAdvertisementStatus = exports.approveAdvertisement = exports.createAdvertisement = exports.updateAdvertisementStatusImpl = exports.approveAdvertisementImpl = exports.createAdvertisementImpl = void 0;
/**
 * 廣告管理工具
 * 提供廣告的建立、審核和狀態更新功能
 */
const uuid_1 = require("uuid");
const db_1 = require("../db");
const errorHandling_1 = require("../utils/errorHandling");
const tool_1 = require("../types/tool");
const toolRegistration_1 = require("../utils/toolRegistration");
// 工具輸入模式定義
const createAdvertisementSchema = {
    type: 'object',
    properties: {
        business_id: { type: 'string', description: '商家 ID' },
        advertisement_name: { type: 'string', description: '廣告名稱' },
        advertisement_description: { type: 'string', description: '廣告描述' },
        advertisement_image_url: { type: 'string', description: '廣告圖片 URL' },
        advertisement_landing_page_url: { type: 'string', description: '廣告著陸頁 URL' },
        advertisement_start_date: { type: 'string', description: '廣告開始日期，ISO 8601 格式' },
        advertisement_end_date: { type: 'string', description: '廣告結束日期，ISO 8601 格式' },
        advertisement_budget: { type: 'number', description: '廣告預算' },
        advertisement_target_audience: { type: 'string', description: '目標受眾描述' }
    },
    required: [
        'business_id',
        'advertisement_name',
        'advertisement_description',
        'advertisement_start_date',
        'advertisement_end_date',
        'advertisement_budget'
    ]
};
const approveAdvertisementSchema = {
    type: 'object',
    properties: {
        advertisement_id: { type: 'string', description: '廣告 ID' },
        approved: { type: 'boolean', description: '是否批准' },
        reason: { type: 'string', description: '拒絕原因（當 approved 為 false 時）' }
    },
    required: ['advertisement_id', 'approved']
};
const updateAdvertisementStatusSchema = {
    type: 'object',
    properties: {
        advertisement_id: { type: 'string', description: '廣告 ID' },
        status: {
            type: 'string',
            description: '新狀態',
            enum: ['active', 'completed']
        }
    },
    required: ['advertisement_id', 'status']
};
// 實作函數
/**
 * 建立新廣告
 * @param params 廣告資訊
 * @returns 新建廣告的 ID
 */
const createAdvertisementImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, createAdvertisementSchema);
    const { business_id, advertisement_name, advertisement_description, advertisement_image_url, advertisement_landing_page_url, advertisement_start_date, advertisement_end_date, advertisement_budget, advertisement_target_audience } = params;
    // 驗證資料
    if (advertisement_name.length > 255) {
        (0, errorHandling_1.throwInvalidParam)('advertisement_name 超過最大長度 (255)');
    }
    if (advertisement_description.length > 1000) {
        (0, errorHandling_1.throwInvalidParam)('advertisement_description 超過最大長度 (1000)');
    }
    const advertisement_id = (0, uuid_1.v4)();
    await db_1.neo4jClient.runQuery(`CREATE (a:Advertisement {
      advertisement_id: $advertisement_id,
      business_id: $business_id,
      advertisement_name: $advertisement_name,
      advertisement_description: $advertisement_description,
      advertisement_image_url: $advertisement_image_url,
      advertisement_landing_page_url: $advertisement_landing_page_url,
      advertisement_start_date: date($advertisement_start_date),
      advertisement_end_date: date($advertisement_end_date),
      advertisement_budget: $advertisement_budget,
      advertisement_target_audience: $advertisement_target_audience,
      advertisement_status: 'pending',
      created_at: datetime(),
      updated_at: datetime()
    }) RETURN a`, {
        advertisement_id,
        business_id,
        advertisement_name,
        advertisement_description,
        advertisement_image_url,
        advertisement_landing_page_url,
        advertisement_start_date,
        advertisement_end_date,
        advertisement_budget,
        advertisement_target_audience
    });
    return { advertisement_id };
};
exports.createAdvertisementImpl = createAdvertisementImpl;
/**
 * 審核廣告
 * @param params 審核參數
 */
const approveAdvertisementImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, approveAdvertisementSchema);
    const { advertisement_id, approved, reason } = params;
    // 審核廣告，將狀態更新為 approved 或 rejected
    await db_1.neo4jClient.runQuery(`MATCH (a:Advertisement {advertisement_id: $advertisement_id})
     WHERE a.advertisement_status = 'pending'
     SET a.advertisement_status = $status,
         a.updated_at = datetime()
     ${reason ? ', a.rejection_reason = $reason' : ''}
     RETURN a`, {
        advertisement_id,
        status: approved ? 'approved' : 'rejected',
        reason
    });
};
exports.approveAdvertisementImpl = approveAdvertisementImpl;
/**
 * 更新廣告狀態
 * @param params 狀態更新參數
 */
const updateAdvertisementStatusImpl = async (params) => {
    // 驗證輸入參數
    (0, tool_1.validateParams)(params, updateAdvertisementStatusSchema);
    const { advertisement_id, status } = params;
    // 確保只有已批准的廣告才能更新為 active 或 completed
    const validTransitions = {
        'approved': ['active'],
        'active': ['completed']
    };
    const result = await db_1.neo4jClient.runQuery(`MATCH (a:Advertisement {advertisement_id: $advertisement_id})
     RETURN a.advertisement_status as current_status`, { advertisement_id });
    if (result.records.length === 0) {
        (0, errorHandling_1.throwIfNotFound)(null, '廣告');
    }
    const currentStatus = result.records[0].get('current_status');
    const allowedStatusChanges = validTransitions[currentStatus] || [];
    if (!allowedStatusChanges.includes(status)) {
        (0, errorHandling_1.throwBusinessLogicError)(`不允許將廣告狀態從 ${currentStatus} 更新為 ${status}`);
    }
    await db_1.neo4jClient.runQuery(`MATCH (a:Advertisement {advertisement_id: $advertisement_id})
     SET a.advertisement_status = $status,
         a.updated_at = datetime()
     RETURN a`, { advertisement_id, status });
};
exports.updateAdvertisementStatusImpl = updateAdvertisementStatusImpl;
// 建立標準化工具定義
exports.createAdvertisement = (0, toolRegistration_1.createToolDefinition)('createAdvertisement', '建立新的廣告', createAdvertisementSchema, exports.createAdvertisementImpl);
exports.approveAdvertisement = (0, toolRegistration_1.createToolDefinition)('approveAdvertisement', '審核待審核的廣告，設置為批准或拒絕', approveAdvertisementSchema, exports.approveAdvertisementImpl);
exports.updateAdvertisementStatus = (0, toolRegistration_1.createToolDefinition)('updateAdvertisementStatus', '更新廣告的狀態（例如從已批准更新為活躍）', updateAdvertisementStatusSchema, exports.updateAdvertisementStatusImpl);
// 廣告相關工具匯出
exports.advertisementTools = {
    createAdvertisement: exports.createAdvertisement,
    approveAdvertisement: exports.approveAdvertisement,
    updateAdvertisementStatus: exports.updateAdvertisementStatus
};
