'use strict';
require('dotenv').config({ quiet: true });

const env = process.env.NODE_ENV || 'development';

if (env === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio en producción');
}

module.exports = {
  env,
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'solo-para-desarrollo-cambiar',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  admin: {
    name: process.env.ADMIN_NAME || 'Administrador',
    email: process.env.ADMIN_EMAIL || 'admin@donaciones.local',
    password: process.env.ADMIN_PASSWORD || 'Admin123!'
  }
};
