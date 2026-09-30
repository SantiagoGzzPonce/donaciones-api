'use strict';
const app = require('./app');
const config = require('./config');
const userService = require('./services/userService');

(async () => {
  await userService.seedAdmin(config.admin);
  app.listen(config.port, () => {
    console.log(`API de donaciones escuchando en puerto ${config.port} (${config.env})`);
  });
})();
