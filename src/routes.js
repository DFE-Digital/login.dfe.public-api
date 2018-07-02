const config = require('./infrastructure/config');
const healthCheck = require('login.dfe.healthcheck');
const services = require('./app/services');

const mountRoutes = (app) => {
  app.use('/healthcheck', healthCheck({ config }));

  app.use('/services', services());
};

module.exports = mountRoutes;