'use strict';

// Etiquetas de dominio sin puntos: no hay cuantificadores que se traslapen (sin backtracking exponencial).
const EMAIL_RE = /^[^\s@<>]+@(?:[^\s@<>.]+\.)+[^\s@<>.]{2,}$/;
const isEmail = (v) => typeof v === 'string' && v.trim().length <= 254 && EMAIL_RE.test(v.trim());
const PHONE_RE = /^\+?[0-9\s-]{7,20}$/;
const NAME_RE = /^[\p{L}\p{N} .,'&-]{2,100}$/u;
const SAFE_TEXT_RE = /^[^<>]*$/;
const DONOR_TYPES = ['persona', 'empresa'];
const ROLES = ['admin', 'usuario'];

const isString = (v) => typeof v === 'string';

function validatePassword(password) {
  const errors = [];
  if (!isString(password) || password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    errors.push('La contraseña debe incluir mayúsculas, minúsculas y números');
  }
  return errors;
}

function validateRegister(body = {}) {
  const errors = [];
  if (!isString(body.name) || !NAME_RE.test(body.name.trim())) {
    errors.push('Nombre inválido (2-100 caracteres, sin símbolos especiales)');
  }
  if (!isEmail(body.email)) {
    errors.push('Correo electrónico inválido');
  }
  return errors.concat(validatePassword(body.password));
}

function validateLogin(body = {}) {
  const errors = [];
  if (!isString(body.email) || !body.email.trim()) errors.push('El correo es obligatorio');
  if (!isString(body.password) || !body.password) errors.push('La contraseña es obligatoria');
  return errors;
}

function validateDonor(body = {}, { partial = false } = {}) {
  const errors = [];
  const has = (k) => body[k] !== undefined;

  if (!partial || has('name')) {
    if (!isString(body.name) || !NAME_RE.test(body.name.trim())) errors.push('Nombre del donante inválido');
  }
  if (!partial || has('email')) {
    if (!isEmail(body.email)) errors.push('Correo del donante inválido');
  }
  if (!partial || has('type')) {
    if (!DONOR_TYPES.includes(body.type)) errors.push('El tipo debe ser "persona" o "empresa"');
  }
  if (has('phone') && (!isString(body.phone) || !PHONE_RE.test(body.phone))) {
    errors.push('Teléfono inválido');
  }
  if (has('address') && (!isString(body.address) || body.address.length > 200 || !SAFE_TEXT_RE.test(body.address))) {
    errors.push('Dirección inválida (máx. 200 caracteres, sin < >)');
  }
  if (has('notes') && (!isString(body.notes) || body.notes.length > 500 || !SAFE_TEXT_RE.test(body.notes))) {
    errors.push('Notas inválidas (máx. 500 caracteres, sin < >)');
  }
  if (partial && Object.keys(body).length === 0) errors.push('No se enviaron campos para actualizar');
  return errors;
}

function validateRole(role) {
  return ROLES.includes(role) ? [] : ['Rol inválido (admin o usuario)'];
}

module.exports = {
  validateRegister, validateLogin, validateDonor, validateRole, validatePassword,
  DONOR_TYPES, ROLES
};
