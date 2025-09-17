const express = require("express");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const { setupApi } = require("login.dfe.api-client/api/setup");
const config = require("./infrastructure/config");
const { requestCorrelation } = require("./app/utils");
const mountRoutes = require("./routes");
const logger = require("./infrastructure/logger");

setupApi({
  auth: {
    tenant: config.directories.service.auth.tenant,
    authorityHostUrl: config.directories.service.auth.authorityHostUrl,
    clientId: config.directories.service.auth.clientId,
    clientSecret: config.directories.service.auth.clientSecret,
    resource: config.directories.service.auth.resource,
  },
  api: {
    access: {
      baseUri: config.access.service.url,
    },
    applications: {
      baseUri: config.applications.service.url,
    },
    directories: {
      baseUri: config.directories.service.url,
    },
    organisations: {
      baseUri: config.organisations.service.url,
    },
  },
});

const app = express();

logger.info("set helmet policy defaults");

const self = "'self'";
const allowedOrigin = "*.signin.education.gov.uk";

app.use(
  helmet({
    strictTransportSecurity: {
      maxAge: config.hostingEnvironment.hstsMaxAge,
      preload: true,
      includeSubDomains: true,
    },
  }),
);

// Setting helmet Content Security Policy
const scriptSources = [self, allowedOrigin];

const styleSources = [self, allowedOrigin];
const imgSources = [self, allowedOrigin, "data:", "blob:"];

if (config.hostingEnvironment.env === "dev") {
  scriptSources.push("localhost");
  styleSources.push("localhost");
  imgSources.push("localhost");
}

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: [self],
      scriptSrc: scriptSources,
      styleSrc: styleSources,
      imgSrc: imgSources,
      fontSrc: [self, "data:", allowedOrigin],
      connectSrc: [self],
      formAction: [self],
      baseUri: [self],
      frameAncestors: [self],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  }),
);

logger.info("Set helmet filters");

app.use(helmet.xssFilter());
app.use(helmet.frameguard("false"));
app.use(helmet.ieNoOpen());

logger.info("helmet setup complete");

if (config.hostingEnvironment.env !== "dev") {
  app.set("trust proxy", 1);
}

app.use(requestCorrelation());
app.use(bodyParser.json());

mountRoutes(app);

module.exports = { app };
