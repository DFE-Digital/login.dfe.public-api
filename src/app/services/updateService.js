const {
  getServiceRaw,
  updateService: updateServiceDetails,
} = require("login.dfe.api-client/services");

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

  await updateServiceDetails({ serviceId: service.id, update: req.body });
  return res.status(202).send();
};
module.exports = updateService;
