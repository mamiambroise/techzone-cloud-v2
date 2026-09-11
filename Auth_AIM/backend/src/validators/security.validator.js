const Joi = require('joi');

const createSecurityEventSchema = Joi.object({
  eventType: Joi.string().min(2).max(120).required(),
  severity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').default('LOW'),
  tenantId: Joi.string().uuid().allow(null).optional(),
  userId: Joi.string().allow(null, '').optional(),
  identityId: Joi.string().allow(null, '').optional(),
  organizationId: Joi.string().allow(null, '').optional(),
  siteId: Joi.string().allow(null, '').optional(),
  sessionId: Joi.string().allow(null, '').optional(),
  deviceId: Joi.string().allow(null, '').optional(),
  source: Joi.string().max(120).default('unknown'),
  resource: Joi.string().max(200).default('unknown'),
  ipSafe: Joi.string().max(45).allow(null, '').optional(),
  traceId: Joi.string().max(200).allow(null, '').optional(),
  status: Joi.string().valid('OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE').default('OPEN'),
  detailsSafe: Joi.string().max(2000).allow(null, '').optional(),
  metadata: Joi.object().default({}),
});

const resolveSchema = Joi.object({
  resolution: Joi.string().max(500).optional(),
});

module.exports = { createSecurityEventSchema, resolveSchema };