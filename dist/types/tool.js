"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = validateParams;
/**
 * 從 JSON Schema 驗證參數是否符合要求
 * 增強實現，支持更多驗證規則
 *
 * @param params 使用者提供的參數
 * @param schema JSON Schema 定義
 * @throws 若驗證失敗則拋出錯誤
 */
function validateParams(params, schema) {
    if (typeof params !== 'object' || params === null) {
        throw new Error('參數必須是一個物件');
    }
    // 驗證必要參數
    if (schema.required && Array.isArray(schema.required)) {
        for (const requiredProp of schema.required) {
            if (!(requiredProp in params)) {
                throw new Error(`缺少必要參數: ${requiredProp}`);
            }
            // 檢查空值
            if (params[requiredProp] === undefined || params[requiredProp] === null || params[requiredProp] === '') {
                throw new Error(`參數 ${requiredProp} 不能為空`);
            }
        }
    }
    // 驗證參數類型和格式
    if (schema.properties) {
        for (const propName in params) {
            // 跳過未定義在 schema 中的屬性
            if (!schema.properties[propName])
                continue;
            const propSchema = schema.properties[propName];
            const value = params[propName];
            // 如果值為 null 或 undefined 且不是必要參數，則跳過驗證
            if ((value === null || value === undefined) &&
                (!schema.required || !schema.required.includes(propName))) {
                continue;
            }
            // 類型驗證
            validateType(propName, value, propSchema);
            // 數字範圍驗證
            if (propSchema.type === 'number' && typeof value === 'number') {
                validateNumberRange(propName, value, propSchema);
            }
            // 字串格式和長度驗證
            if (propSchema.type === 'string' && typeof value === 'string') {
                validateStringFormat(propName, value, propSchema);
            }
            // 陣列驗證
            if (propSchema.type === 'array' && Array.isArray(value)) {
                validateArray(propName, value, propSchema);
            }
            // 物件驗證
            if (propSchema.type === 'object' && typeof value === 'object' && value !== null) {
                validateObject(propName, value, propSchema);
            }
        }
    }
}
/**
 * 驗證參數類型
 * @param propName 屬性名稱
 * @param value 屬性值
 * @param propSchema 屬性結構定義
 */
function validateType(propName, value, propSchema) {
    if (value === null || value === undefined)
        return;
    switch (propSchema.type) {
        case 'number':
        case 'integer':
            if (typeof value !== 'number') {
                throw new Error(`參數 ${propName} 必須是數字類型，目前提供的是 ${typeof value}`);
            }
            if (propSchema.type === 'integer' && !Number.isInteger(value)) {
                throw new Error(`參數 ${propName} 必須是整數，目前提供的是 ${value}`);
            }
            break;
        case 'string':
            if (typeof value !== 'string') {
                throw new Error(`參數 ${propName} 必須是字串類型，目前提供的是 ${typeof value}`);
            }
            break;
        case 'boolean':
            if (typeof value !== 'boolean') {
                throw new Error(`參數 ${propName} 必須是布林類型，目前提供的是 ${typeof value}`);
            }
            break;
        case 'array':
            if (!Array.isArray(value)) {
                throw new Error(`參數 ${propName} 必須是陣列類型，目前提供的是 ${typeof value}`);
            }
            break;
        case 'object':
            if (typeof value !== 'object' || value === null) {
                throw new Error(`參數 ${propName} 必須是物件類型，目前提供的是 ${value === null ? 'null' : typeof value}`);
            }
            break;
    }
    // 驗證枚舉值
    if (propSchema.enum && !propSchema.enum.includes(value)) {
        throw new Error(`參數 ${propName} 必須是以下值之一: ${propSchema.enum.join(', ')}，目前提供的是 ${value}`);
    }
}
/**
 * 驗證數字範圍
 * @param propName 屬性名稱
 * @param value 屬性值
 * @param propSchema 屬性結構定義
 */
function validateNumberRange(propName, value, propSchema) {
    if ('minimum' in propSchema && value < propSchema.minimum) {
        throw new Error(`參數 ${propName} 必須大於或等於 ${propSchema.minimum}，目前提供的是 ${value}`);
    }
    if ('maximum' in propSchema && value > propSchema.maximum) {
        throw new Error(`參數 ${propName} 必須小於或等於 ${propSchema.maximum}，目前提供的是 ${value}`);
    }
    if ('exclusiveMinimum' in propSchema && value <= propSchema.exclusiveMinimum) {
        throw new Error(`參數 ${propName} 必須大於 ${propSchema.exclusiveMinimum}，目前提供的是 ${value}`);
    }
    if ('exclusiveMaximum' in propSchema && value >= propSchema.exclusiveMaximum) {
        throw new Error(`參數 ${propName} 必須小於 ${propSchema.exclusiveMaximum}，目前提供的是 ${value}`);
    }
    if ('multipleOf' in propSchema && value % propSchema.multipleOf !== 0) {
        throw new Error(`參數 ${propName} 必須是 ${propSchema.multipleOf} 的倍數，目前提供的是 ${value}`);
    }
}
/**
 * 驗證字串格式和長度
 * @param propName 屬性名稱
 * @param value 屬性值
 * @param propSchema 屬性結構定義
 */
function validateStringFormat(propName, value, propSchema) {
    if ('minLength' in propSchema && value.length < propSchema.minLength) {
        throw new Error(`參數 ${propName} 長度必須至少為 ${propSchema.minLength} 個字元，目前長度為 ${value.length}`);
    }
    if ('maxLength' in propSchema && value.length > propSchema.maxLength) {
        throw new Error(`參數 ${propName} 長度不能超過 ${propSchema.maxLength} 個字元，目前長度為 ${value.length}`);
    }
    if (propSchema.pattern) {
        const regex = new RegExp(propSchema.pattern);
        if (!regex.test(value)) {
            throw new Error(`參數 ${propName} 格式不符合要求，必須符合模式: ${propSchema.pattern}`);
        }
    }
    // 常見格式驗證
    if (propSchema.format) {
        switch (propSchema.format) {
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    throw new Error(`參數 ${propName} 必須是有效的電子郵件地址，目前提供的是 ${value}`);
                }
                break;
            case 'date':
            case 'date-time':
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    throw new Error(`參數 ${propName} 必須是有效的${propSchema.format === 'date' ? '日期' : '日期時間'}格式，目前提供的是 ${value}`);
                }
                break;
            case 'uri':
                try {
                    new URL(value);
                }
                catch (e) {
                    throw new Error(`參數 ${propName} 必須是有效的 URI，目前提供的是 ${value}`);
                }
                break;
            case 'uuid':
                if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
                    throw new Error(`參數 ${propName} 必須是有效的 UUID，目前提供的是 ${value}`);
                }
                break;
        }
    }
}
/**
 * 驗證陣列
 * @param propName 屬性名稱
 * @param value 屬性值
 * @param propSchema 屬性結構定義
 */
function validateArray(propName, value, propSchema) {
    if ('minItems' in propSchema && value.length < propSchema.minItems) {
        throw new Error(`參數 ${propName} 必須至少包含 ${propSchema.minItems} 個項目，目前包含 ${value.length} 個`);
    }
    if ('maxItems' in propSchema && value.length > propSchema.maxItems) {
        throw new Error(`參數 ${propName} 不能超過 ${propSchema.maxItems} 個項目，目前包含 ${value.length} 個`);
    }
    if (propSchema.uniqueItems && new Set(value).size !== value.length) {
        throw new Error(`參數 ${propName} 的所有項目必須是唯一的`);
    }
    // 驗證陣列項目
    if (propSchema.items) {
        for (let i = 0; i < value.length; i++) {
            try {
                validateType(`${propName}[${i}]`, value[i], propSchema.items);
                if (propSchema.items.type === 'number' && typeof value[i] === 'number') {
                    validateNumberRange(`${propName}[${i}]`, value[i], propSchema.items);
                }
                else if (propSchema.items.type === 'string' && typeof value[i] === 'string') {
                    validateStringFormat(`${propName}[${i}]`, value[i], propSchema.items);
                }
                else if (propSchema.items.type === 'array' && Array.isArray(value[i])) {
                    validateArray(`${propName}[${i}]`, value[i], propSchema.items);
                }
                else if (propSchema.items.type === 'object' && typeof value[i] === 'object' && value[i] !== null) {
                    validateObject(`${propName}[${i}]`, value[i], propSchema.items);
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new Error(`陣列 ${propName} 的第 ${i} 個項目驗證失敗: ${errorMessage}`);
            }
        }
    }
}
/**
 * 驗證物件
 * @param propName 屬性名稱
 * @param value 屬性值
 * @param propSchema 屬性結構定義
 */
function validateObject(propName, value, propSchema) {
    // 如果有定義物件的屬性結構，則驗證每個屬性
    if (propSchema.properties) {
        // 驗證必要屬性
        if (propSchema.required && Array.isArray(propSchema.required)) {
            for (const requiredProp of propSchema.required) {
                if (!(requiredProp in value)) {
                    throw new Error(`物件 ${propName} 缺少必要屬性: ${requiredProp}`);
                }
            }
        }
        // 驗證每個屬性
        for (const subPropName in value) {
            if (propSchema.properties[subPropName]) {
                try {
                    validateType(`${propName}.${subPropName}`, value[subPropName], propSchema.properties[subPropName]);
                    if (propSchema.properties[subPropName].type === 'number' && typeof value[subPropName] === 'number') {
                        validateNumberRange(`${propName}.${subPropName}`, value[subPropName], propSchema.properties[subPropName]);
                    }
                    else if (propSchema.properties[subPropName].type === 'string' && typeof value[subPropName] === 'string') {
                        validateStringFormat(`${propName}.${subPropName}`, value[subPropName], propSchema.properties[subPropName]);
                    }
                    else if (propSchema.properties[subPropName].type === 'array' && Array.isArray(value[subPropName])) {
                        validateArray(`${propName}.${subPropName}`, value[subPropName], propSchema.properties[subPropName]);
                    }
                    else if (propSchema.properties[subPropName].type === 'object' && typeof value[subPropName] === 'object' && value[subPropName] !== null) {
                        validateObject(`${propName}.${subPropName}`, value[subPropName], propSchema.properties[subPropName]);
                    }
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    throw new Error(`物件 ${propName} 的屬性 ${subPropName} 驗證失敗: ${errorMessage}`);
                }
            }
            else if (propSchema.additionalProperties === false) {
                throw new Error(`物件 ${propName} 不允許包含未定義的屬性: ${subPropName}`);
            }
        }
    }
}
