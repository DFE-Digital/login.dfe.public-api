const {
  getClientByServiceId,
  updateService,
} = require("./../../infrastructure/applications");
const uuid = require("uuid");

const regenerateSecret = async (req, res) => {
  const service = await getClientByServiceId(req.params.clientid);
  if (!service) {
    return res.status(404).send();
  }
  if (service.parentId !== req.client.id) {
    return res.status(403).send();
  }

  const clientSecret = uuid.v4();
  await updateService(service.id, { clientSecret }, req.correlationId);
  return res.json({ clientSecret });
};
module.exports = regenerateSecret;
