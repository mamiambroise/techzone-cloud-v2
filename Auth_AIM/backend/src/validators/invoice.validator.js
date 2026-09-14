const Joi = require('joi');

const generateInvoiceSchema = Joi.object({
  subscriptionId: Joi.string().required(),
});

const applyPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
});

const voidInvoiceSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});

module.exports = { generateInvoiceSchema, applyPaymentSchema, voidInvoiceSchema };