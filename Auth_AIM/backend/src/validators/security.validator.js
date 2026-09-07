const Joi = require('joi');

const resolveSchema = Joi.object({
  resolution: Joi.string().max(500).optional(),
});

module.exports = { resolveSchema };