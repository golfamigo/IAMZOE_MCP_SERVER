"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/utils/ajv.ts
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
// Initialize AJV with default options
const ajv = new ajv_1.default({ allErrors: true }); // allErrors: true to get detailed validation errors
(0, ajv_formats_1.default)(ajv); // Adds standard formats like 'email', 'uri', 'date', etc.
// Add custom UUID format
ajv.addFormat('uuid', {
    type: 'string',
    validate: (str) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    },
});
// Add custom date-time format (if not already covered by ajv-formats)
ajv.addFormat('date-time', {
    type: 'string',
    validate: (str) => {
        const date = new Date(str);
        return !isNaN(date.getTime());
    },
});
// Add custom date format (if needed)
ajv.addFormat('date', {
    type: 'string',
    validate: (str) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return dateRegex.test(str) && !isNaN(new Date(str).getTime());
    },
});
exports.default = ajv;
