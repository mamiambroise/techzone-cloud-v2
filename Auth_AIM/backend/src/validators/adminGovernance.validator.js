const Joi = require('joi');

const revokeAssignmentSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});

module.exports = { revokeAssignmentSchema };
