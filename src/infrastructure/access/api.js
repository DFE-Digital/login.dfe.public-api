const config = require("./../config");

const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");

const callApi = async (
  route,
  correlationId,
  method = "GET",
  body = undefined,
) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();
  try {
    let uri = config.access.service.url;
    if (!uri.endsWith("/") && !route.startsWith("/")) {
      uri += "/";
    }
    uri += route;

    return await fetchApi(uri, {
      method: method || "GET",
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
      body,
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const getPoliciesOfService = async (sid, correlationId) => {
  return await callApi(`/services/${sid}/policies`, correlationId);
};

const getServiceUsers = async (sid, oid, correlationId) => {
  return await callApi(
    `/services/${sid}/organisations/${oid}/users`,
    correlationId,
  );
};

const getRoles = async (sid, correlationId) => {
  return await callApi(`/services/${sid}/roles`, correlationId);
};

const getServices = async (sid, correlationId) => {
  return await callApi(`/services/${sid}`, correlationId);
};

const getServicesForUser = async (userId, correlationId) => {
  return await callApi(`/users/${userId}/services`, correlationId);
};

const getServiceUsersV2 = async (
  sid,
  oid,
  roleIds,
  page,
  pageSize,
  correlationId,
) => {
  return await callApi(
    `/services/${sid}/organisations/${oid}/users?version=v2&page=${page}&pageSize=${pageSize}&roleIds=${roleIds.join(",")}`,
    correlationId,
  );
};

module.exports = {
  getPoliciesOfService,
  getServiceUsers,
  getServices,
  getServicesForUser,
  getRoles,
  getServiceUsersV2,
};
