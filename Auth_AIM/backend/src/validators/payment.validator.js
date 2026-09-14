const Joi = require('joi');

const initiatePaymentSchema = Joi.object({
  invoiceId: Joi.string().required(),
  provider: Joi.string().required(),
  paymentMethod: Joi.string().optional(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).uppercase().optional(),
  externalReference: Joi.string().optional(),
});

const markFailedSchema = Joi.object({
  failureCode: Joi.string().optional(),
  failureMessage: Joi.string().optional(),
});

const markSucceededSchema = Joi.object({
  externalReference: Joi.string().optional(),
});

const refundSchema = Joi.object({
  amount: Joi.number().positive().optional(),
  reason: Joi.string().max(500).optional(),
});

module.exports = { initiatePaymentSchema, markFailedSchema, markSucceededSchema, refundSchema };