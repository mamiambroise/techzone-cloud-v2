const Joi = require('joi');

const createPlanSchema = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().optional(),
  billingInterval: Joi.string().valid('MONTHLY', 'QUARTERLY', 'SEMESTER', 'YEARLY', 'CUSTOM').required(),
  price: Joi.number().min(0).required(),
  currency: Joi.string().length(3).uppercase().default('MGA'),
  trialDays: Joi.number().integer().min(0).optional(),
  metadata: Joi.object().optional(),
});

const updatePlanSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).optional(),
  currency: Joi.string().length(3).uppercase().optional(),
  billingInterval: Joi.string().valid('MONTHLY', 'QUARTERLY', 'SEMESTER', 'YEARLY', 'CUSTOM').optional(),
  trialDays: Joi.number().integer().min(0).optional(),
  metadata: Joi.object().optional(),
});

const newVersionSchema = updatePlanSchema.keys({ code: Joi.string().required() });

const addEntitlementSchema = Joi.object({
  featureCode: Joi.string().required(),
  valueType: Joi.string().valid('BOOLEAN', 'INTEGER', 'DECIMAL', 'STRING', 'JSON').required(),
  enabled: Joi.boolean().default(true),
  integerValue: Joi.number().integer().optional(),
  decimalValue: Joi.number().optional(),
  stringValue: Joi.string().optional(),
  jsonValue: Joi.object().optional(),
});

module.exports = { createPlanSchema, updatePlanSchema, newVersionSchema, addEntitlementSchema };