const {
  getServiceRaw,
  updateService,
} = require("login.dfe.api-client/services");
const uuid = require("uuid");

const regenerateSecret = async (req, res) => {
  const service = await getServiceRaw({
    by: { clientId: req.params.clientid },
  });
  if (!service) {
    return res.status(404).send();
  }
  if (service.parentId !== req.client.id) {
    return res.status(403).send();
  }

  const clientSecret = uuid.v4();
  await updateService({
    serviceId: service.id,
    update: { clientSecret: clientSecret },
  });
  return res.json({ clientSecret });
};
module.exports = regenerateSecret;
