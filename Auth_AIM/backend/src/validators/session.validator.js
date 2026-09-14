const Joi = require('joi');

const revokeReasonSchema = Joi.object({
  reason: Joi.string().max(255).optional(),
});

const validateTokenSchema = Joi.object({
  accessToken: Joi.string().required(),
});

module.exports = { revokeReasonSchema, validateTokenSchema };