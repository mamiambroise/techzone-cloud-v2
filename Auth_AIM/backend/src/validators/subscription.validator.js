const Joi = require('joi');

const subscribeSchema = Joi.object({
  tenantId: Joi.string().required(),
  planId: Joi.string().required(),
  applicationCode: Joi.string().optional(),
  startTrial: Joi.boolean().default(true),
});

const changePlanSchema = Joi.object({
  newPlanId: Joi.string().required(),
  policy: Joi.string().valid('IMMEDIATE', 'END_OF_PERIOD').default('END_OF_PERIOD'),
});

const suspendSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});

const cancelSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
  atPeriodEnd: Joi.boolean().default(true),
});

module.exports = { subscribeSchema, changePlanSchema, suspendSchema, cancelSchema };