const Joi = require('joi');

const createFeatureSchema = Joi.object({
  code: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().optional(),
  metered: Joi.boolean().default(false),
  quotaCode: Joi.string().optional(),
  metadata: Joi.object().optional(),
});

const updateFeatureSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  metered: Joi.boolean().optional(),
  quotaCode: Joi.string().optional(),
  metadata: Joi.object().optional(),
});

module.exports = { createFeatureSchema, updateFeatureSchema };