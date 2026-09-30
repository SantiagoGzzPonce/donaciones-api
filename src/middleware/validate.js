'use strict';
const { AppError } = require('../utils/errors');

const validate = (validator, options) => (req, res, next) => {
  const errors = validator(req.body, options);
  return errors.length ? next(new AppError(400, 'Datos inválidos', errors)) : next();
};

module.exports = validate;
