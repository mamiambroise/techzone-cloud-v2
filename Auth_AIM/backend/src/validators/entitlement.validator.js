const Joi = require('joi');

const createOverrideSchema = Joi.object({
  valueType: Joi.string().valid('BOOLEAN', 'INTEGER', 'DECIMAL', 'STRING', 'JSON').required(),
  enabled: Joi.boolean().optional(),
  integerValue: Joi.number().integer().optional(),
  decimalValue: Joi.number().optional(),
  stringValue: Joi.string().optional(),
  jsonValue: Joi.object().optional(),
  reason: Joi.string().max(500).required(),
  validFrom: Joi.date().iso().optional(),
  validUntil: Joi.date().iso().optional(),
});

const consumeQuotaSchema = Joi.object({
  amount: Joi.number().positive().default(1),
});

module.exports = { createOverrideSchema, consumeQuotaSchema };