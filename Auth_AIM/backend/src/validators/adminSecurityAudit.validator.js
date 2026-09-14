const Joi = require('joi');

const securityStatusSchema = Joi.object({
  status: Joi.string().valid('OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE').required(),
  reason: Joi.string().max(500).optional(),
}).required();

module.exports = { securityStatusSchema };
