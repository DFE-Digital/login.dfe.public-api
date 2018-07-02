'use strict';

const winston = require('winston');
const config = require('./../config');
const WinstonSequelizeTransport = require('login.dfe.audit.winston-sequelize-transport');
const appInsights = require('applicationinsights');
const AppInsightsTransport = require('login.dfe.winston-appinsights');

const logLevel = (config && config.loggerSettings && config.loggerSettings.logLevel) ? config.loggerSettings.logLevel : 'info';

const loggerConfig = {
  levels: {
    audit: 0,
    error: 1,
    warn: 2,
    info: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: (config && config.loggerSettings && config.loggerSettings.colors) ? config.loggerSettings.colors : null,
  transports: [],
};

loggerConfig.transports.push(new (winston.transports.Console)({level: logLevel, colorize: true}));

const sequelizeTransport = WinstonSequelizeTransport(config);
if (sequelizeTransport) {
  loggerConfig.transports.push(sequelizeTransport);
}

if (config.hostingEnvironment.applicationInsights) {
  appInsights.setup(config.hostingEnvironment.applicationInsights).setAutoCollectConsole(false, false).start();
  loggerConfig.transports.push(new AppInsightsTransport({
    client: appInsights.defaultClient,
    applicationName: config.loggerSettings.applicationName || 'Help',
    type: 'event',
    treatErrorsAsExceptions: true,
  }));
}

const logger = new (winston.Logger)(loggerConfig);

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at:', p, 'reason:', reason);
});

module.exports = logger;
