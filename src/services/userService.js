'use strict';
const bcrypt = require('bcryptjs');
const config = require('../config');
const { state, newId } = require('../data/store');
const { AppError } = require('../utils/errors');

const toPublic = ({ passwordHash, ...user }) => user;

async function createUser({ name, email, password, role = 'usuario' }) {
  const normalized = email.trim().toLowerCase();
  if (state.users.some((u) => u.email === normalized)) {
    throw new AppError(409, 'El correo ya está registrado');
  }
  const user = {
    id: newId(),
    name: name.trim(),
    email: normalized,
    passwordHash: await bcrypt.hash(password, config.bcryptRounds),
    role,
    createdAt: new Date().toISOString()
  };
  state.users.push(user);
  return toPublic(user);
}

async function verifyCredentials(email, password) {
  const user = state.users.find((u) => u.email === email.trim().toLowerCase());
  // Se compara siempre contra un hash para no revelar si el correo existe (timing).
  const hash = user ? user.passwordHash : '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok) throw new AppError(401, 'Credenciales inválidas');
  return toPublic(user);
}

function findById(id) {
  const user = state.users.find((u) => u.id === id);
  return user ? toPublic(user) : null;
}

const listUsers = () => state.users.map(toPublic);

function updateRole(id, role) {
  const user = state.users.find((u) => u.id === id);
  if (!user) throw new AppError(404, 'Usuario no encontrado');
  user.role = role;
  return toPublic(user);
}

async function seedAdmin({ name, email, password }) {
  const existing = state.users.find((u) => u.email === email.toLowerCase());
  if (existing) return toPublic(existing);
  return createUser({ name, email, password, role: 'admin' });
}

module.exports = { createUser, verifyCredentials, findById, listUsers, updateRole, seedAdmin };
