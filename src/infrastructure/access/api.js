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

const getUsersAccessToServiceAtOrganisation = async (
  uid,
  sid,
  oid,
  correlationId,
) => {
  return await callApi(
    `/users/${uid}/services/${sid}/organisations/${oid}`,
    correlationId,
  );
};

const getPoliciesOfService = async (sid, correlationId) => {
  return await callApi(`/services/${sid}/policies`, correlationId);
};

/**
 * Gets users for service (for all organisations).  If userId is NOT provided then it
 * will get every user for the service.  Depending on the data, this could be 1000s of
 * users.
 *
 * Note: As of 12/06/25, the paging for this endpoint appears to be bugged.
 * Regardless of the page and pageSize you provide this endpoint, it'll always
 * return everything it has.
 *
 * @param {String} sid Service id for the service
 * @param {Array} userIds optional array of user ids to search for
 * @param {String} correlationId Id to link requests into a single transaction
 *
 */
const getServiceUsers = async (sid, userIds, correlationId) => {
  if (userIds) {
    return await callApi(
      `/services/${sid}/users?userIds=${userIds.join(",")}`,
      correlationId,
    );
  }
  return await callApi(`/services/${sid}/users`, correlationId);
};

const getServiceUsersForOrganisation = async (sid, oid, correlationId) => {
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

const getServiceUsersForOrganisationV2 = async (
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
  getUsersAccessToServiceAtOrganisation,
  getPoliciesOfService,
  getServices,
  getServicesForUser,
  getRoles,
  getServiceUsers,
  getServiceUsersForOrganisation,
  getServiceUsersForOrganisationV2,
};
