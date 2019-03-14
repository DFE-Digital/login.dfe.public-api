const config = require('./../config');
const KeepAliveAgent = require('agentkeepalive').HttpsAgent;

const rp = require('request-promise').defaults({
  agent: new KeepAliveAgent({
    maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
    maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
    timeout: config.hostingEnvironment.agentKeepAlive.timeout,
    keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
  }),
});
const jwtStrategy = require('login.dfe.jwt-strategies');

const getClientByServiceId = async (id) => {
  if (!id) {
    return undefined;
  }
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const client = await rp({
      method: 'GET',
      uri: `${config.applications.service.url}/services/${id}`,
      headers: {
        authorization: `bearer ${token}`,
      },
      json: true,
    });
    return client;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const createService = async (service, correlationId) => {
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const client = await rp({
      method: 'POST',
      uri: `${config.applications.service.url}/services`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: service,
      json: true,
    });
    return client;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const updateService = async (id, patchedProperties, correlationId) => {
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const client = await rp({
      method: 'PATCH',
      uri: `${config.applications.service.url}/services/${id}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: patchedProperties,
      json: true,
    });
    return client;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const listServices = async (parentId, page, pageSize, correlationId) => {
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const pageOfServices = await rp({
      method: 'GET',
      uri: `${config.applications.service.url}/services?page=${page}&pageSize=${pageSize}&parent=${parentId}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });
    return pageOfServices;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

module.exports = {
  getClientByServiceId,
  createService,
  updateService,
  listServices,
};
