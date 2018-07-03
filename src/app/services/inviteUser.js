const { validate: validateEmail } = require("email-validator");
const uuid = require('uuid/v4');
const KeepAliveAgent = require('agentkeepalive');
const config = require('./../../infrastructure/config');
const logger = require('./../../infrastructure/logger');
const rp = require('request-promise').defaults({
  agent: new KeepAliveAgent({
    maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
    maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
    timeout: config.hostingEnvironment.agentKeepAlive.timeout,
    keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
  }),
});
const jwt = require('jsonwebtoken');

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
      userRedirectUrl: req.body.userRedirectUrl || undefined,
    },
  };

  if (req.params.sid.toLowerCase() !== 'da03ea7a-6c5b-4864-be53-2eaccf63bec4') {
    result.status = 404;
    result.errors.push(`Unrecognised service id ${req.params.sid}`);
    return result;
  }

  if (!result.details.sourceId) {
    result.status = 400;
    result.errors.push('Missing sourceId');
  }

  if (!result.details.givenName) {
    result.status = 400;
    result.errors.push('Missing given_name');
  }

  if (!result.details.familyName) {
    result.status = 400;
    result.errors.push('Missing family_name');
  }

  if (!result.details.email) {
    result.status = 400;
    result.errors.push('Missing email');
  } else if (!validateEmail(result.details.email)) {
    result.status = 400;
    result.errors.push('email is not a valid email address');
  }

  if (!result.details.callbackUrl) {
    result.status = 400;
    result.errors.push('Missing callback');
  }

  return result;
};

const wait = (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};
const sendResponseThroughBackChannel = async (callbackUrl, uid, sourceId) => {
  try {
    await wait(2000);

    const token = jwt.sign({}, config.auth.secret, {
      expiresIn: 60000,
      issuer: 'DfE Sign-in'
    });

    await rp({
      method: 'POST',
      uri: callbackUrl,
      headers: {
        authorization: `bearer ${token}`,
      },
      body: {
        sub: uid,
        sourceId,
      },
      json: true,
    });
  }
  catch (e) {
    logger.error(`Error calling callback for source id ${sourceId} - ${e.message}`, { uid, sourceId, callbackUrl });
  }
};

const inviteUser = async (req, res) => {
  const request = await parseAndValidateRequest(req);
  if (request.status === 400 || request.status === 404) {
    return res.status(request.status).send({ errors: request.errors });
  }

  if (request.details.email.toLowerCase() === 'alreadyassociated@dfesignin.test') {
    sendResponseThroughBackChannel(request.details.callbackUrl, '0c30cc28-f945-4888-b6ef-e4b3d0de08f1', request.details.sourceId);
  } else if (request.details.email.toLowerCase() === 'existswithoutorg@dfesignin.test') {
    sendResponseThroughBackChannel(request.details.callbackUrl, '99d1a8de-2a11-404a-ab7f-4bd38fbd25ca', request.details.sourceId);
  } else {
    sendResponseThroughBackChannel(request.details.callbackUrl, uuid(), request.details.sourceId);
  }

  return res.status(202).send();
};

module.exports = inviteUser;
