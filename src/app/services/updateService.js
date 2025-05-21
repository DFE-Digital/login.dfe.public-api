const {
  updateService: updateServiceDetails,
} = require("./../../infrastructure/applications");

const { getServiceRaw } = require("login.dfe.api-client/services");

const patchableProperties = [
  "name",
  "description",
  "redirectUris",
  "consentTitle",
  "consentBody",
];

const validate = (req) => {
  const keys = Object.keys(req.body);

  if (keys.length === 0) {
    return `Must specify at least one property. Patchable properties ${patchableProperties}`;
  }
  const error = keys.map((key) => {
    const value = req.body[key];
    if (!patchableProperties.find((x) => x === key)) {
      return `${key} is not a patchable property. Patchable properties ${patchableProperties}`;
    }
    if (key === "redirectUris" && !(value instanceof Array)) {
      return `${key} must be an array`;
    }
    return null;
  });
  return error.find((x) => x !== null);
};

const updateService = async (req, res) => {
  const service = await getServiceRaw({
    by: { clientId: req.params.clientid },
  });
  if (!service) {
    return res.status(404).send();
  }
  if (service.parentId !== req.client.id) {
    return res.status(403).send();
  }

  const validation = validate(req);
  if (validation) {
    return res.status(400).send(validation);
  }

  const patch = {
    name: req.body.name,
    description: req.body.description,
    redirect_uris: req.body.redirectUris,
    consentTitle: req.body.consentTitle,
    consentBody: req.body.consentBody,
  };
  await updateServiceDetails(service.id, patch, req.correlationId);
  return res.status(202).send();
};
module.exports = updateService;
