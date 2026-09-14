const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(32).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string().min(10).max(128).required(),
});

const loginSchema = Joi.object({
  identifier: Joi.string().required(),
  password: Joi.string().required(),
  deviceFingerprint: Joi.string().required(),
  deviceName: Joi.string().optional(),
  deviceType: Joi.string().optional(),
  tenantId: Joi.string().optional(),
  organizationId: Joi.string().optional(),
  siteId: Joi.string().optional(),
  applicationId: Joi.string().optional(),
  environment: Joi.string().optional(),
});

const mfaVerifySchema = Joi.object({
  challengeToken: Joi.string().required(),
  mfaMethodId: Joi.string().required(),
  code: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const logoutAllSchema = Joi.object({
  keepCurrentSession: Joi.boolean().optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(10).max(128).required(),
});
const stepUpSchema = Joi.object({
  resource: Joi.string().optional(),
  action: Joi.string().optional(),
});

const stepUpVerifySchema = Joi.object({
  challengeToken: Joi.string().required(),
  mfaMethodId: Joi.string().required(),
  code: Joi.string().required(),
});
module.exports = {
  registerSchema,
  loginSchema,
  mfaVerifySchema,
  refreshSchema,
  logoutAllSchema,
  changePasswordSchema,
  stepUpSchema,
  stepUpVerifySchema,
};