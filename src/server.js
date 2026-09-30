'use strict';
const app = require('./app');
const config = require('./config');
const userService = require('./services/userService');

async function start() {
  await userService.seedAdmin(config.admin);
  app.listen(config.port, () => {
    console.log(`API de donaciones escuchando en puerto ${config.port} (${config.env})`);
  });
}

start().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err);
  process.exit(1);
});
