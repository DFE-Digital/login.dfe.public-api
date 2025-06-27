const WinstonSequelizeTransport = require("login.dfe.audit.winston-sequelize-transport");
const {
  setupApplicationInsights,
  setupLogging,
} = require("login.dfe.api-client/logging");
const config = require("../config");

const additionalTransports = [];

const sequelizeTransport = WinstonSequelizeTransport(config);
if (sequelizeTransport) {
  additionalTransports.push(sequelizeTransport);
}

if (config.hostingEnvironment.applicationInsights) {
  setupApplicationInsights(config.hostingEnvironment.applicationInsights);
}

module.exports = setupLogging({
  applicationName: config.loggerSettings.applicationName || "PublicApi",
  logLevel: config.loggerSettings?.logLevel,
  additionalTransports,
});
