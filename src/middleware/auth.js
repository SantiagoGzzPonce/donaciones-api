'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config');
const userService = require('../services/userService');
const { AppError } = require('../utils/errors');

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: 'HS256'
  });
}

function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Token no proporcionado'));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    const user = userService.findById(payload.sub);
    if (!user) throw new Error('Usuario inexistente');
    req.user = user; // el rol se toma de la BD, no del token (evita roles obsoletos)
    return next();
  } catch (err) {
    return next(new AppError(401, 'Token inválido o expirado'));
  }
}

const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : next(new AppError(403, 'No tienes permisos para esta acción'));

module.exports = { signToken, authenticate, authorize };
