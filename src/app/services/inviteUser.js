const { validate: validateEmail } = require("email-validator");
const { isHttpUri, isHttpsUri } = require("valid-url");
const config = require("./../../infrastructure/config");
const logger = require("./../../infrastructure/logger");
const { getClientByServiceId } = require("./../../infrastructure/applications");
const PublicApiClient = require("login.dfe.public-api.jobs.client");

const jobsClient = new PublicApiClient(config.queue);

const parseAndValidateRequest = async (req) => {
  const result = {
    status: 200,
    errors: [],
    details: {
      sourceId: req.body.sourceId || undefined,
      givenName: req.body.given_name || undefined,
      familyName: req.body.family_name || undefined,
      email: req.body.email || undefined,
      organisationId: req.body.organisation || undefined,
      callbackUrl: req.body.callback || undefined,
      userRedirect: req.body.userRedirect || undefined,
      clientId: undefined,
      inviteSubjectOverride: req.body.inviteSubjectOverride || undefined,
      inviteBodyOverride: req.body.inviteBodyOverride || undefined,
    },
  };

  const client = await getClientByServiceId(req.params.sid);
  if (!client) {
    result.status = 404;
    return result;
  }
  result.details.clientId = client.relyingParty.client_id;

  if (!result.details.sourceId) {
    result.status = 400;
    result.errors.push("Missing sourceId");
  }

  if (!result.details.givenName) {
    result.status = 400;
    result.errors.push("Missing given_name");
  }

  if (!result.details.familyName) {
    result.status = 400;
    result.errors.push("Missing family_name");
  }

  if (!result.details.email) {
    result.status = 400;
    result.errors.push("Missing email");
  } else if (!validateEmail(result.details.email)) {
    result.status = 400;
    result.errors.push("email is not a valid email address");
  }

  if (
    !!result.details.callbackUrl &&
    !isHttpUri(result.details.callbackUrl) &&
    !isHttpsUri(result.details.callbackUrl)
  ) {
    result.status = 400;
    result.errors.push(
      "callback must be a valid, fully qualified, http(s) URI",
    );
  }

  if (
    result.details.userRedirect &&
    !isHttpUri(result.details.userRedirect) &&
    !isHttpsUri(result.details.userRedirect)
  ) {
    result.status = 400;
    result.errors.push(
      "userRedirect must be a valid, fully qualified, http(s) URI",
    );
  } else if (!result.details.userRedirect) {
    result.details.userRedirect = client.relyingParty.redirect_uris[0];
  }

  return result;
};
const queueInvitationRequest = async (details) => {
  await jobsClient.sendInvitationRequest(
    details.givenName,
    details.familyName,
    details.email,
    details.organisationId,
    details.sourceId,
    details.callbackUrl,
    details.userRedirect,
    details.clientId,
    details.inviteSubjectOverride,
    details.inviteBodyOverride,
  );
  logger.info(
    `Queued invitation for source id = ${details.sourceId}, callback = ${details.callbackUrl}`,
  );
};

const inviteUser = async (req, res) => {
  const request = await parseAndValidateRequest(req);
  if (request.status === 400 || request.status === 404) {
    return res.status(request.status).send({ errors: request.errors });
  }

  await queueInvitationRequest(request.details);

  return res.status(202).send();
};

module.exports = inviteUser;
