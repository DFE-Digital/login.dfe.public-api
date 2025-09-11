const fs = require('fs');
const os = require('os');
const path = require('path');

require('dotenv').config();

const config = {
  loggerSettings: {
    logLevel: "info",
    applicationName: "Public-Api"
  },
  hostingEnvironment: {
    env: process.env.LOCAL_ENV || "azure",
    host: process.env.LOCAL_HOST || process.env.STANDALONE_PUBLIC_API_HOST_NAME,
    port: process.env.LOCAL_PORT_PUBLIC_API || 443,
    sslCert: process.env.LOCAL_SSL_CERT ? process.env.LOCAL_SSL_CERT.replace(/\\n/g, '\n') : "",
    sslKey: process.env.LOCAL_SSL_KEY ? process.env.LOCAL_SSL_KEY.replace(/\\n/g, '\n') : "",
    protocol: "https",
    hstsMaxAge: Number(process.env.HSTS_MAX_AGE) || 86400,
    applicationInsights: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    agentKeepAlive: {
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 60000,
      keepAliveTimeout: 30000
    }
  },
  auth: {
    type: "secret",
    secret: process.env.PAPI_AUTH_SECRET
  },
  queue: {
    connectionString: process.env.LOCAL_REDIS_CONN ? process.env.LOCAL_REDIS_CONN + "/4" : process.env.REDIS_CONN + "/4?tls=true"
  },
  notifications: {
    connectionString: process.env.LOCAL_REDIS_CONN ? process.env.LOCAL_REDIS_CONN + "/4" : process.env.REDIS_CONN + "/4?tls=true"
  },
  adapter: {
    type: "sequelize",
    directories: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: "svcSigninDir",
      password: process.env.SVC_SIGNIN_DIR_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_DIRECTORIES_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },
    organisation: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_ORG,
      password: process.env.SVC_SIGNIN_ORG_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_ORGANISATIONS_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  },
  directories: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_DIRECTORIES_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    }
  },
  applications: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_APPLICATIONS_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    }
  },
  access: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_ACCESS_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    }
  },
  organisations: {
    type: "api",
    service: {
      url: "https://" + process.env.STANDALONE_ORGANISATIONS_HOST_NAME,
      auth: {
        type: "aad",
        tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
        authorityHostUrl: process.env.TENANT_URL,
        clientId: process.env.AAD_SHD_CLIENT_ID,
        clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
        resource: process.env.AAD_SHD_APP_ID
      }
    }
  }
}

// Persist configuration to a temporary file and then point the `settings` environment
// variable to the path of the temporary file. The `login.dfe.dao` package can then load
// this configuration.
function mimicLegacySettings(config) {
  // TODO: This can be improved by refactoring the `login.dfe.dao` package.
  const tempDirectoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'config-'));
  const tempConfigFilePath = path.join(tempDirectoryPath, 'config.json');

  fs.writeFileSync(tempConfigFilePath, JSON.stringify(config), { encoding: 'utf8' });
  process.env.settings = tempConfigFilePath;
}

mimicLegacySettings(config);

module.exports = config;
