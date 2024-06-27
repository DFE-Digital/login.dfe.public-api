const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const config = require('./infrastructure/config');
const { requestCorrelation } = require('./app/utils');
const mountRoutes = require('./routes');
const logger = require('./infrastructure/logger');

const app = express();

logger.info('set helmet policy defaults');

  const self = "'self'";
  const allowedOrigin = '*.signin.education.gov.uk';
  
  app.use(helmet({
    strictTransportSecurity: {
      maxAge: 86400,
      preload: true,
      includeSubDomains: true,
    }
  }));

  // Setting helmet Content Security Policy
  const scriptSources = [self, "'unsafe-inline'", "'unsafe-eval'", allowedOrigin, 'https://code.jquery.com'];
  const styleSources = [self, allowedOrigin];
  const imgSources = [self, allowedOrigin, 'data:', 'blob:'];

  if (config.hostingEnvironment.env === 'dev') {
    scriptSources.push('localhost');
    styleSources.push('localhost');
    imgSources.push('localhost');
  }

  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [self],
      scriptSrc: scriptSources,
      styleSrc: styleSources,
      imgSrc: imgSources,
      fontSrc: [self, 'data:', allowedOrigin],
      connectSrc: [self],
      formAction: [self, '*'],
    },
  }));

  logger.info('Set helmet filters');

  app.use(helmet.xssFilter());
  app.use(helmet.frameguard('false'));
  app.use(helmet.ieNoOpen());

  logger.info('helmet setup complete');

if (config.hostingEnvironment.env !== 'dev') {
  app.set('trust proxy', 1);
}

app.use(requestCorrelation());
app.use(bodyParser.json());

mountRoutes(app);

module.exports = { app };
