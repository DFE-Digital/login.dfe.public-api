const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const config = require('./infrastructure/config');
const { requestCorrelation } = require('./app/utils');
const mountRoutes = require('./routes');
const logger = require('./infrastructure/logger');

const app = express();

if (config.hostingEnvironment.hstsMaxAge) {
  app.use(helmet({
    noCache: true,
    hsts: {
      maxAge: config.hostingEnvironment.hstsMaxAge,
      preload: true,
    },
  }));
}

logger.info('set helmet policy defaults');

// Setting helmet Content Security Policy
const scriptSources = ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost', '*.signin.education.gov.uk', 'https://code.jquery.com'];

app.use(helmet.contentSecurityPolicy({
  browserSniff: false,
  setAllHeaders: false,
  useDefaults: false,
  directives: {
    defaultSrc: ["'self'"],
    childSrc: ["'none'"],
    objectSrc: ["'none'"],
    scriptSrc: scriptSources,
    styleSrc: ["'self'", "'unsafe-inline'", 'localhost', '*.signin.education.gov.uk'],
    imgSrc: ["'self'", 'data:', 'blob:', 'localhost', '*.signin.education.gov.uk'],
    fontSrc: ["'self'", 'data:', '*.signin.education.gov.uk'],
    connectSrc: ["'self'"],
    formAction: ["'self'", '*'],
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
