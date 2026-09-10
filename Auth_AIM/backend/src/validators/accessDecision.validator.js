const Joi = require('joi');

const decideAccessSchema = Joi.object({
  tenantId: Joi.string().required(),
  resource: Joi.string().required(),
  action: Joi.string().required(),
  featureCode: Joi.string().required(),
  applicationCode: Joi.string().optional(),
});

module.exports = { decideAccessSchema };