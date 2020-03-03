const express = require('express');
const logger = require('./infrastructure/logger');
const config = require('./infrastructure/config');
const bodyParser = require('body-parser');
const { requestCorrelation } = require('./app/utils');
const mountRoutes = require('./routes');
const http = require('http');
const https = require('https');

https.globalAgent.maxSockets = http.globalAgent.maxSockets = config.hostingEnvironment.agentKeepAlive.maxSockets || 50;

const app = express();
if (config.hostingEnvironment.env !== 'dev') {
  app.set('trust proxy', 1);
}

app.use(requestCorrelation());
app.use(bodyParser.json());

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
    logger.info(`Dev server listening on https://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`);
  });
} else {
  app.listen(process.env.PORT, () => {
    logger.info(`Server listening on http://${config.hostingEnvironment.host}:${process.env.PORT}`);
  });
}