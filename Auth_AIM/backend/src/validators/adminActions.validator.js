const Joi = require('joi');

const adminActionRequestSchema = Joi.object({
  tenantId: Joi.string().uuid().allow(null).optional(),
  actionType: Joi.string().trim().min(2).max(80).required(),
  targetType: Joi.string().trim().min(2).max(80).required(),
  targetId: Joi.string().trim().max(200).allow(null).optional(),
  reason: Joi.string().trim().max(500).optional(),
  metadata: Joi.object().default({}),
  dryRun: Joi.boolean().optional(),
}).required();

const adminActionExecutionSchema = Joi.object({
  resultStatus: Joi.string().valid('COMPLETED', 'FAILED', 'CANCELLED').optional(),
  failureReason: Joi.string().trim().max(500).optional(),
  metadata: Joi.object().default({}),
}).required();

module.exports = { adminActionRequestSchema, adminActionExecutionSchema };
