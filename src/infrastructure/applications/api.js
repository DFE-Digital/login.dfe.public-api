const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");

const config = require("../config");

const getClientByServiceId = async (id, correlationId) => {
  if (!id) {
    return undefined;
  }
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const client = await fetchApi(
      `${config.applications.service.url}/services/${id}`,
      {
        method: "GET",
        headers: {
          authorization: `bearer ${token}`,
          "x-correlation-id": correlationId,
        },
      },
    );
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
    const client = await fetchApi(
      `${config.applications.service.url}/services`,
      {
        method: "POST",
        headers: {
          authorization: `bearer ${token}`,
          "x-correlation-id": correlationId,
        },
        body: service,
      },
    );
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
    const client = await fetchApi(
      `${config.applications.service.url}/services/${id}`,
      {
        method: "PATCH",
        headers: {
          authorization: `bearer ${token}`,
          "x-correlation-id": correlationId,
        },
        body: patchedProperties,
      },
    );
    return client;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const destroyService = async (id, correlationId) => {
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const client = await fetchApi(
      `${config.applications.service.url}/services/${id}`,
      {
        method: "DELETE",
        headers: {
          authorization: `bearer ${token}`,
          "x-correlation-id": correlationId,
        },
      },
    );
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
    const pageOfServices = await fetchApi(
      `${config.applications.service.url}/services?page=${page}&pageSize=${pageSize}&parent=${parentId}`,
      {
        method: "GET",
        headers: {
          authorization: `bearer ${token}`,
          "x-correlation-id": correlationId,
        },
      },
    );
    return pageOfServices;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const listServiceGrants = async (serviceId, page, pageSize, correlationId) => {
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const pageOfGrants = await fetchApi(
      `${config.applications.service.url}/services/${serviceId}/grants?page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: {
          authorization: `bearer ${token}`,
          "x-correlation-id": correlationId,
        },
      },
    );
    return pageOfGrants;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const listServiceGrantTokens = async (
  serviceId,
  grantId,
  page,
  pageSize,
  correlationId,
) => {
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const pageOfTokens = await fetchApi(
      `${config.applications.service.url}/services/${serviceId}/grants/${grantId}/tokens?page=${page}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: {
          authorization: `bearer ${token}`,
          "x-correlation-id": correlationId,
        },
      },
    );
    return pageOfTokens;
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
  destroyService,
  listServiceGrants,
  listServiceGrantTokens,
};
