const Joi = require('joi');

const enrollSchema = Joi.object({
  type: Joi.string().valid('TOTP', 'EMAIL', 'SMS').required(),
  label: Joi.string().optional(),
});

const verifyEnrollmentSchema = Joi.object({
  methodId: Joi.string().required(),
  code: Joi.string().required(),
});

const verifyCodeSchema = Joi.object({
  methodId: Joi.string().required(),
  code: Joi.string().required(),
});

const recoveryVerifySchema = Joi.object({
  code: Joi.string().required(),
});

module.exports = { enrollSchema, verifyEnrollmentSchema, verifyCodeSchema, recoveryVerifySchema };
