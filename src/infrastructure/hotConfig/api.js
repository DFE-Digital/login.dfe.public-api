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

const list = async () => {
  const token = await jwtStrategy(config.hotConfig.service).getBearerToken();

  return rp({
    method: 'GET',
    uri: `${config.hotConfig.service.url}/oidcclients`,
    headers: {
      authorization: `bearer ${token}`,
    },
    json: true,
  });
};

const getClientByServiceId = async (serviceId) => {
  const all = await list();
  return all.find(x => x.params && x.params.serviceId && x.params.serviceId.toLowerCase() === serviceId.toLowerCase());
};

const getClientById = async (clientId) => {
  const token = await jwtStrategy(config.hotConfig.service).getBearerToken();

  try {
    return await rp({
      method: 'GET',
      uri: `${config.hotConfig.service.url}/oidcclients/${clientId}`,
      headers: {
        authorization: `bearer ${token}`,
      },
      json: true,
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

module.exports = {
  list,
  getClientByServiceId,
  getClientById,
};
