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

const getRoles = async (sid, correlationId) => {
  return await callApi(`/services/${sid}/roles`, correlationId);
};

const getServices = async (sid, correlationId) => {
  return await callApi(`/services/${sid}`, correlationId);
};

const getServicesForUser = async (userId, correlationId) => {
  return await callApi(`/users/${userId}/services`, correlationId);
};

module.exports = {
  getServices,
  getServicesForUser,
  getRoles,
};
