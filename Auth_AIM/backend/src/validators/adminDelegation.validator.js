const Joi = require('joi');

const createDelegationSchema = Joi.object({
  tenantId: Joi.string().uuid().optional(),
  grantedBy: Joi.string().required(),
  grantedTo: Joi.string().required(),
  scopeType: Joi.string().valid('tenant', 'application', 'environment', 'support', 'facturation', 'billing', 'security', 'securite').required(),
  scopeId: Joi.string().allow('').optional(),
  permissions: Joi.array().items(Joi.string().min(1)).min(1).required(),
  startsAt: Joi.date().iso().optional(),
  endsAt: Joi.date().iso().custom((value, helpers) => {
    const startsAt = helpers.state.ancestors[0].startsAt;
    if (startsAt && new Date(value).getTime() <= new Date(startsAt).getTime()) {
      return helpers.message('"endsAt" must be greater than "startsAt"');
    }
    if (!startsAt && new Date(value).getTime() <= Date.now()) {
      return helpers.message('"endsAt" must be in the future');
    }
    return value;
  }, 'endsAt validation').optional(),
  reason: Joi.string().max(500).optional(),
}).required();

const revokeDelegationSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});

module.exports = {
  createDelegationSchema,
  revokeDelegationSchema,
};
