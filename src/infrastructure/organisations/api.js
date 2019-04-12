const jwtStrategy = require('login.dfe.jwt-strategies');
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
const promiseRetry = require('promise-retry');

const callOrganisationsApi = async (endpoint, method, body, correlationId) => {
  const token = await jwtStrategy(config.organisations.service).getBearerToken();

  const numberOfRetires = config.organisations.service.numberOfRetries || 3;
  const retryFactor = config.organisations.service.retryFactor || 2;

  return promiseRetry(async (retry, number) => {
      try {
        return await rp({
          method: method,
          uri: `${config.organisations.service.url}/${endpoint}`,
          headers: {
            authorization: `bearer ${token}`,
            'x-correlation-id': correlationId,
          },
          body: body,
          json: true,
          strictSSL: config.hostingEnvironment.env.toLowerCase() !== 'dev',
        });
      } catch (e) {
        const status = e.statusCode ? e.statusCode : 500;
        if (status === 401 || status === 404) {
          return null;
        }
        if (status === 409) {
          return false;
        }
        if ((status === 500 || status === 503) && number < numberOfRetires) {
          retry();
        }
        throw e;
      }
    }, { factor: retryFactor }
  );


};

const getOrganisationByTypeAndIdentifier = async (type, identifier, correlationId) => {
  return await callOrganisationsApi(`organisations/by-external-id/${type}/${identifier}`, 'GET', undefined, correlationId);
};

const searchForAnnouncements = async (messageId, correlationId) => {
  return await callOrganisationsApi(`organisations/announcements?messageid=${messageId}`, 'GET', undefined, correlationId);
};

const upsertOrganisationAnnouncement = async (organisationId, messageId, type, title, summary, body, publishedAt, expiresAt, published, correlationId) => {
  const requestBody = {
    originId: messageId,
    type,
    title,
    summary,
    body,
    publishedAt,
    expiresAt,
    published
  };
  return await callOrganisationsApi(`organisations/${organisationId}/announcements`, 'POST', requestBody, correlationId);
};

const getOrganisationsAssociatedWithUser = async (userId, correlationId) => {
  return await callOrganisationsApi(`organisations/v2/associated-with-user/${userId}`, 'GET', undefined, correlationId);
};

module.exports = {
  getOrganisationByTypeAndIdentifier,
  searchForAnnouncements,
  upsertOrganisationAnnouncement,
  getOrganisationsAssociatedWithUser,
};
