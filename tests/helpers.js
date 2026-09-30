const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const store = require('../src/data/store');
const userService = require('../src/services/userService');

// Contraseñas generadas en cada ejecución: no hay credenciales fijas en el código.
const randomSecret = (prefix) => `${prefix}${crypto.randomBytes(8).toString('hex')}9`;
const USER_SECRET = randomSecret('Us');
const ADMIN = { name: 'Admin', email: 'admin@test.com', password: randomSecret('Ad') };

async function resetAndSeed() {
  store.reset();
  await userService.seedAdmin(ADMIN);
}

async function login(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

async function registerUser(email = 'user@test.com', name = 'Usuario Prueba') {
  const res = await request(app).post('/api/auth/register')
    .send({ name, email, password: USER_SECRET });
  return { token: res.body.token, user: res.body.user };
}

const adminToken = () => login(ADMIN.email, ADMIN.password);

const donor = (overrides = {}) => ({
  name: 'Supermercado La Esperanza',
  email: 'contacto@esperanza.mx',
  type: 'empresa',
  phone: '+52 81 1234 5678',
  address: 'Av. Constitución 100, Monterrey',
  ...overrides
});

module.exports = { app, request, resetAndSeed, login, registerUser, adminToken, donor, ADMIN };
