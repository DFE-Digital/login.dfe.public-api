const uuid = require('uuid/v4');
const { createService: createServiceInApi } = require('./../../infrastructure/applications');

const parseAndValidateModel = (req) => {
  const model = {
    service: {
      name: req.body.name,
      description: req.body.description,
      redirectUris: req.body.redirectUris || [],
    },
    validationErrors: [],
  };

  if (!model.service.name) {
    model.validationErrors.push('Must provide name');
  }

  if (model.service.redirectUris.length < 1) {
    model.validationErrors.push('Must provide at least 1 redirectUris');
  }

  return model;
};
const createService = async (req, res) => {
  if (!req.client.relyingParty.params || req.client.relyingParty.params.canCreateChildApplications !== 'true') {
    return res.status(403).send();
  }

  const model = parseAndValidateModel(req);
  if (model.validationErrors.length > 0) {
    return res.status(400).json({ reasons: model.validationErrors });
  }

  const service = {
    name: model.service.name,
    description: model.service.description,
    isExternalService: false,
    parentId: req.client.id,
    relyingParty: {
      client_id: `c${uuid().replace(/\-/g, '')}`,
      client_secret: uuid(),
      redirect_uris: model.service.redirectUris,
      grant_types: ['authorization_code', 'refresh_token'],
      params: {
        hideApprover: 'true',
        hideSupport: 'true',
        explicitConsent: 'true',
      },
    },
  };
  const createdService = await createServiceInApi(service);
  return res.status(201).json({
    name: createdService.name,
    description: createdService.description,
    clientId: createdService.relyingParty.client_id,
    clientSecret: createdService.relyingParty.client_secret,
    redirectUris: createdService.relyingParty.redirect_uris,
  });
};
module.exports = createService;
