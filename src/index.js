const express = require('express');
const logger = require('./infrastructure/logger');
const https = require('https');
const config = require('./infrastructure/config');
const apiAuth = require('login.dfe.api.auth');
const mountRoutes = require('./routes');

const app = express();
if (config.hostingEnvironment.env !== 'dev') {
  app.set('trust proxy', 1);
}

app.use(apiAuth(app, config));

mountRoutes(app);

if (config.hostingEnvironment.env === 'dev') {
  app.proxy = true;

  const options = {
    key: config.hostingEnvironment.sslKey,
    cert: config.hostingEnvironment.sslCert,
    requestCert: false,
    rejectUnauthorized: false,
  };
  const server = https.createServer(options, app);

  server.listen(config.hostingEnvironment.port, () => {
    logger.info(`Dev server listening on https://${config.hostingEnvironment.host}:${config.hostingEnvironment.port} with config:\n${JSON.stringify(config)}`);
  });
} else {
  app.listen(process.env.PORT, () => {
    logger.info(`Server listening on http://localhost:${process.env.PORT}`);
  });
}