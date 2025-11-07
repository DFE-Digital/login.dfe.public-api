const http = require("http");
const https = require("https");
const { app } = require("./app");
const config = require("./infrastructure/config");
const logger = require("./infrastructure/logger");
const { setupEncryption } = require("login.dfe.api-client/encryption");

setupEncryption({
  providers: {
    AES256_GCM_V1: {
      key: config.encryption.Aes256GcmV1Key,
    },
  },
});

http.globalAgent.maxSockets =
  config.hostingEnvironment.agentKeepAlive.maxSockets || 50;
https.globalAgent.maxSockets =
  config.hostingEnvironment.agentKeepAlive.maxSockets || 50;

if (config.hostingEnvironment.env === "dev") {
  app.proxy = true;

  const options = {
    key: config.hostingEnvironment.sslKey,
    cert: config.hostingEnvironment.sslCert,
    requestCert: false,
    rejectUnauthorized: false,
  };
  const server = https.createServer(options, app);

  server.listen(config.hostingEnvironment.port, () => {
    logger.info(
      `Dev server listening on https://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`,
    );
  });
} else {
  app.listen(process.env.PORT, () => {
    logger.info(
      `Server listening on http://${config.hostingEnvironment.host}:${process.env.PORT}`,
    );
  });
}
