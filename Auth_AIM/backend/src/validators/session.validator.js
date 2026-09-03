const Joi = require('joi');

const revokeReasonSchema = Joi.object({
  reason: Joi.string().max(255).optional(),
});

module.exports = { revokeReasonSchema };