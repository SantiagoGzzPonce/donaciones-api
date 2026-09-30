'use strict';
const config = require('../config');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON mal formado' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Solicitud demasiado grande' });
  }
  const status = err.status || 500;
  const body = { error: status === 500 ? 'Error interno del servidor' : err.message };
  if (err.details) body.details = err.details;
  if (status === 500 && config.env !== 'test') console.error(err);
  return res.status(status).json(body);
}

const notFound = (req, res) => res.status(404).json({ error: 'Recurso no encontrado' });

module.exports = { errorHandler, notFound };
