const Joi = require('joi');

const changeStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'LOCKED', 'DISABLED', 'ARCHIVED').required(),
  reason: Joi.string().max(500).required(),
});

const revokeSessionsSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});

module.exports = { changeStatusSchema, revokeSessionsSchema };