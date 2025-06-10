const jwtStrategy = require("login.dfe.jwt-strategies");
const config = require("./../config");
const { fetchApi } = require("login.dfe.async-retry");

const callOrganisationsApi = async (endpoint, method, body, correlationId) => {
  const token = await jwtStrategy(
    config.organisations.service,
  ).getBearerToken();

  try {
    const route = `${config.organisations.service.url}/${endpoint}`;
    const result = await fetchApi(`${route}`, {
      method: method,
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
      body: body,
    });
    return result;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 401 || status === 404) {
      return null;
    }
    if (status === 409) {
      return false;
    }
    throw e;
  }
};

const listServiceUsers = async (
  serviceId,
  userIds,
  status,
  fromDate,
  toDate,
  page,
  pageSize,
  correlationId,
) => {
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const url = `${config.organisations.service.url}/services/${serviceId}/users`;

    const pageOfUsers = await fetchApi(url, {
      method: "POST",
      body: {
        status: status,
        from: fromDate,
        to: toDate,
        page,
        pageSize,
        userIds,
      },
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
    });
    return pageOfUsers;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

module.exports = {
  listServiceUsers,
};
