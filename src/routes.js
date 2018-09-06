const config = require('./infrastructure/config');
const logger = require('./infrastructure/logger');
const { auth } = require('./app/utils');
const { getClientById } = require('./infrastructure/hotConfig');
const { getClientByServiceId } = require('./infrastructure/applications');
const healthCheck = require('login.dfe.healthcheck');
const services = require('./app/services');
const organisations = require('./app/organisations');

const mountRoutes = (app) => {
  app.use('/healthcheck', healthCheck({ config }));

  app.use(auth({
    audience: 'signin.education.gov.uk',
    clockTolerance: 30,
    clientLookup: getClientByServiceId,
  }));

  app.use('/services', services());
  app.use('/organisations', organisations());

  app.use((err, req, res, next) => {
    logger.error(`Unhandled error processing ${req.url} - ${err.message} [server id: ${req.correlationId}, client id: ${req.clientCorrelationId}]`, {
      url: req.url,
      correlationId: req.correlationId,
      clientCorrelationId: req.clientCorrelationId,
    });

    if (res.headersSent) {
      return next(err);
    }

    const body = {
      id: req.correlationId,
    };
    if (config.hostingEnvironment.env === 'dev') {
      body.code = err.code;
      body.message = err.message;
      body.stack = err.stack;
    }
    res.status(500).send(body);
  });
};

module.exports = mountRoutes;
