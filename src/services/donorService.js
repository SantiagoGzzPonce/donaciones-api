'use strict';
const { state, newId } = require('../data/store');
const { AppError } = require('../utils/errors');

const FIELDS = ['name', 'email', 'phone', 'type', 'address', 'notes'];

function pick(data) {
  const out = {};
  for (const f of FIELDS) {
    if (data[f] !== undefined) out[f] = typeof data[f] === 'string' ? data[f].trim() : data[f];
  }
  if (out.email) out.email = out.email.toLowerCase();
  return out;
}

const canAccess = (donor, user) => user.role === 'admin' || donor.createdBy === user.id;

function list(user, { q, type } = {}) {
  let result = user.role === 'admin' ? state.donors : state.donors.filter((d) => d.createdBy === user.id);
  if (type) result = result.filter((d) => d.type === type);
  if (q) {
    const term = String(q).toLowerCase();
    result = result.filter((d) => d.name.toLowerCase().includes(term) || d.email.includes(term));
  }
  return result;
}

function getById(id, user) {
  const donor = state.donors.find((d) => d.id === id);
  if (!donor) throw new AppError(404, 'Donante no encontrado');
  if (!canAccess(donor, user)) throw new AppError(403, 'No tienes acceso a este donante');
  return donor;
}

function create(data, user) {
  const clean = pick(data);
  if (state.donors.some((d) => d.email === clean.email)) {
    throw new AppError(409, 'Ya existe un donante con ese correo');
  }
  const now = new Date().toISOString();
  const donor = { id: newId(), ...clean, createdBy: user.id, createdAt: now, updatedAt: now };
  state.donors.push(donor);
  return donor;
}

function update(id, data, user) {
  const donor = getById(id, user);
  const clean = pick(data);
  if (clean.email && state.donors.some((d) => d.email === clean.email && d.id !== id)) {
    throw new AppError(409, 'Ya existe un donante con ese correo');
  }
  Object.assign(donor, clean, { updatedAt: new Date().toISOString() });
  return donor;
}

function remove(id) {
  const idx = state.donors.findIndex((d) => d.id === id);
  if (idx === -1) throw new AppError(404, 'Donante no encontrado');
  state.donors.splice(idx, 1);
}

module.exports = { list, getById, create, update, remove };
