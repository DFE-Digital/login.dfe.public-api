const config = require('./infrastructure/config');
const logger = require('./infrastructure/logger');
const healthCheck = require('login.dfe.healthcheck');
const services = require('./app/services');

const mountRoutes = (app) => {
  app.use('/healthcheck', healthCheck({ config }));

  app.use('/services', services());

  app.use((err, req, res, next) => {
    logger.error(`Unhandled error processing ${req.url} - ${err.message}`);
    if (res.headersSent) {
      return next(err);
    }

    const body = config.hostingEnvironment.env === 'dev' ? {
      code: err.code,
      message: err.message,
      stack: err.stack
    } : undefined;
    res.status(500).send(body);
  });
};

module.exports = mountRoutes;