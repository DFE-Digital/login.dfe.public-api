const jwtStrategy = require("login.dfe.jwt-strategies");
const config = require("./../config");
const { fetchApi } = require("login.dfe.async-retry");

const callOrganisationsApi = async (endpoint, method, body, correlationId) => {
  const token = await jwtStrategy(
    config.organisations.service,
  ).getBearerToken();

  try {
    return await fetchApi(`${config.organisations.service.url}/${endpoint}`, {
      method: method,
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
      body: body,
    });
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
  page,
  pageSize,
  correlationId,
) => {
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const url = `${config.organisations.service.url}/services/${serviceId}/users`;
    const pageOfUsers = await fetchApi(url, {
      method: "POST",
      body: { page, pageSize, userIds },
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

const getOrganisationByTypeAndIdentifier = async (
  type,
  identifier,
  correlationId,
) => {
  return await callOrganisationsApi(
    `organisations/by-external-id/${type}/${identifier}`,
    "GET",
    undefined,
    correlationId,
  );
};

const searchForAnnouncements = async (messageId, correlationId) => {
  return await callOrganisationsApi(
    `organisations/announcements?messageid=${messageId}`,
    "GET",
    undefined,
    correlationId,
  );
};

const upsertOrganisationAnnouncement = async (
  organisationId,
  messageId,
  type,
  title,
  summary,
  body,
  publishedAt,
  expiresAt,
  published,
  correlationId,
) => {
  const requestBody = {
    originId: messageId,
    type,
    title,
    summary,
    body,
    publishedAt,
    expiresAt,
    published,
  };
  return await callOrganisationsApi(
    `organisations/${organisationId}/announcements`,
    "POST",
    requestBody,
    correlationId,
  );
};

const getOrganisationsAssociatedWithUserV2 = async (userId, correlationId) => {
  return await callOrganisationsApi(
    `organisations/v3/associated-with-user/${userId}`,
    "GET",
    undefined,
    correlationId,
  );
};

const listOrganisationUsersV3 = async (
  page,
  pageSize,
  roleId,
  policies,
  correlationId,
) => {
  let uri = `organisations/v3/users`;
  const payload = {
    page: page,
    pageSize: pageSize,
    role: roleId,
    policies: policies,
  };
  return await callOrganisationsApi(uri, "POST", payload, correlationId);
};

const getUserOrganisation = async (userId, organisationId, correlationId) => {
  let uri = `organisations/v3/users`;
  const payload = {
    page: 1,
    pageSize: 1,
    userId,
    organisationId,
  };
  return await callOrganisationsApi(uri, "POST", payload, correlationId);
};

const getUsersForOrganisation = async (organisationId, correlationId) => {
  return await callOrganisationsApi(
    `/organisations/${organisationId}/users`,
    "GET",
    undefined,
    correlationId,
  );
};

const getServiceById = async (serviceId, correlationId) => {
  return await callOrganisationsApi(
    `services/${serviceId}`,
    "GET",
    undefined,
    correlationId,
  );
};

const getOrganisationCategories = async (correlationId) => {
  return await callOrganisationsApi(
    `organisations/categories`,
    "GET",
    undefined,
    correlationId,
  );
};

module.exports = {
  getOrganisationByTypeAndIdentifier,
  searchForAnnouncements,
  upsertOrganisationAnnouncement,
  getOrganisationsAssociatedWithUserV2,
  getUsersForOrganisation,
  getOrganisationCategories,
  listServiceUsers,
  listOrganisationUsersV3,
  getUserOrganisation,
  getServiceById,
};
