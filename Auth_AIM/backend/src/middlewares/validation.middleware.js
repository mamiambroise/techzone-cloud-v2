const { AppError } = require('../utils/response');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
      return next(new AppError('Validation échouée', 422, 'VALIDATION_ERROR', details));
    }
    req[source] = value;
    return next();
  };
}

module.exports = { validate };