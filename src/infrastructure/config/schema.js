const SimpleSchema = require('simpl-schema').default;
const { validateConfigAgainstSchema, schemas, patterns } = require('login.dfe.config.schema.common');
const config = require('./index');
const logger = require('./../logger');

const notificationsSchema = new SimpleSchema({
  connectionString: patterns.redis,
});

const adapterSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['file', 'redis', 'mongo', 'azuread', 'sequelize'],
  },
  directories: {
    type: schemas.sequelizeConnection,
    optional: true,
  },
  organisation: {
    type: schemas.sequelizeConnection,
    optional: true,
  },
});

const encryptionSchema = new SimpleSchema({
  Aes256GcmV1Key: {
    type: String,
  },
});

const schema = new SimpleSchema({
  loggerSettings: schemas.loggerSettings,
  hostingEnvironment: schemas.hostingEnvironment,
  directories: schemas.apiClient,
  organisations: schemas.apiClient,
  applications: schemas.apiClient,
  access: schemas.apiClient,
  search: schemas.apiClient,
  database: schemas.sequelizeConnection,
  notifications: notificationsSchema,
  adapter: adapterSchema,
  assets: schemas.assets,
  encryption: encryptionSchema,
});

module.exports.validate = () => {
  validateConfigAgainstSchema(config, schema, logger);
};
