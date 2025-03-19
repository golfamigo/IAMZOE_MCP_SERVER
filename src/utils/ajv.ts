// src/utils/ajv.ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Initialize AJV with default options
const ajv = new Ajv({ allErrors: true }); // allErrors: true to get detailed validation errors
addFormats(ajv); // Adds standard formats like 'email', 'uri', 'date', etc.

// Add custom UUID format
ajv.addFormat('uuid', {
  type: 'string',
  validate: (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  },
});

// Add custom date-time format (if not already covered by ajv-formats)
ajv.addFormat('date-time', {
  type: 'string',
  validate: (str: string) => {
    const date = new Date(str);
    return !isNaN(date.getTime());
  },
});

// Add custom date format (if needed)
ajv.addFormat('date', {
  type: 'string',
  validate: (str: string) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(str) && !isNaN(new Date(str).getTime());
  },
});

export default ajv;