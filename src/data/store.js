'use strict';
// Almacenamiento en memoria para el entorno de pruebas.
// En una siguiente iteración se reemplaza por PostgreSQL (ver plan de mejora).
const crypto = require('crypto');

const state = { users: [], donors: [] };

function reset() {
  state.users.length = 0;
  state.donors.length = 0;
}

const newId = () => crypto.randomUUID();

module.exports = { state, reset, newId };
