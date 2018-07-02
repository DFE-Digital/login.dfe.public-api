const { validate: validateEmail } = require("email-validator");

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
    },
  };

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

const inviteUser = async (req, res) => {
  const validationResult = await parseAndValidateRequest(req);
  if (validationResult.status === 400) {
    return res.status(400).send({ errors: validationResult.errors });
  }

  return res.status(202).send();
};

module.exports = inviteUser;
