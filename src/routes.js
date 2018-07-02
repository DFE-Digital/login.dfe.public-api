const config = require('./infrastructure/config');
const healthCheck = require('login.dfe.healthcheck');

const mountRoutes = (app) => {
  app.use('/healthcheck', healthCheck({ config }));
};

module.exports = mountRoutes;