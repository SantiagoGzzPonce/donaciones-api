'use strict';
require('dotenv').config({ quiet: true });

const env = process.env.NODE_ENV || 'development';

if (env === 'production') {
  for (const key of ['JWT_SECRET', 'ADMIN_PASSWORD']) {
    if (!process.env[key]) throw new Error(`${key} es obligatorio en producción`);
  }
}

module.exports = {
  env,
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'solo-para-desarrollo-cambiar',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  // Lista separada por comas; vacío = sin CORS (solo mismo origen)
  corsOrigins: (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean),
  admin: {
    name: process.env.ADMIN_NAME || 'Administrador',
    email: process.env.ADMIN_EMAIL || 'admin@donaciones.local',
    password: process.env.ADMIN_PASSWORD || 'Admin123!'
  }
};
