const Joi = require('joi');

const changeTenantStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'ACTIVE', 'SUSPENDED', 'DISABLED', 'ARCHIVED').required(),
  reason: Joi.string().max(500).required(),
});

module.exports = { changeTenantStatusSchema };