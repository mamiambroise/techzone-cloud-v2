const Joi = require('joi');

const updateUserSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  displayName: Joi.string().optional(),
  phone: Joi.string().optional(),
  locale: Joi.string().optional(),
  timezone: Joi.string().optional(),
  defaultTenantId: Joi.string().optional(),
});

const statusActionSchema = Joi.object({
  reason: Joi.string().max(255).optional(),
});

module.exports = { updateUserSchema, statusActionSchema };