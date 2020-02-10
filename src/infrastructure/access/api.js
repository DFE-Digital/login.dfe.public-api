const config = require('./../config');
const KeepAliveAgent = require('agentkeepalive').HttpsAgent;

const rp = require('login.dfe.request-promise-retry').defaults({
  agent: new KeepAliveAgent({
    maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
    maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
    timeout: config.hostingEnvironment.agentKeepAlive.timeout,
    keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
  }),
});
const jwtStrategy = require('login.dfe.jwt-strategies');

const callApi = async (route, correlationId, method = 'GET', body = undefined) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();
  try {
    let uri = config.access.service.url;
    if (!uri.endsWith('/') && !route.startsWith('/')) {
      uri += '/';
    }
    uri += route;

    return await rp({
      method: method || 'GET',
      uri,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body,
      json: true,
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const getUsersAccessToServiceAtOrganisation = async (uid, sid, oid, correlationId) => {
  return await callApi(`/users/${uid}/services/${sid}/organisations/${oid}`, correlationId);
};

const getPoliciesOfService = async (sid, correlationId) => {
  return await callApi(`/services/${sid}/policies`, correlationId);
};

const getServiceUsers = async (sid, oid, correlationId) => {
  return await callApi(`/services/${sid}/organisations/${oid}/users`, correlationId);
}

const getRoles = async (sid,correlationId) => {
  return  await  callApi(`/services/${sid}/roles`, correlationId)
}

const getServiceUsersV2 = async (sid, oid, roleIds, page, pageSize, correlationId) => {
  if(roleIds) {
    return await callApi(`/services/v2/${sid}/organisations/${oid}/users?page=${page}&pageSize=${pageSize}&roleIds=${roleIds.join(',')}`, correlationId);
  }else{
    return await callApi(`/services/v2/${sid}/organisations/${oid}/users?page=${page}&pageSize=${pageSize}`, correlationId);
  }
}

module.exports = {
  getUsersAccessToServiceAtOrganisation,
  getPoliciesOfService,
  getServiceUsers,
  getRoles,
  getServiceUsersV2,
};
