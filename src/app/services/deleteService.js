const {
  getServiceRaw,
  deleteService: destroyService,
} = require("login.dfe.api-client/services");

const deleteService = async (req, res) => {
  const service = await getServiceRaw({
    by: { clientId: req.params.clientid },
  });
  if (!service) {
    return res.status(404).send();
  }
  if (service.parentId !== req.client.id) {
    return res.status(403).send();
  }

  await destroyService({ serviceId: service.id });
  return res.status(202).send();
};
module.exports = deleteService;
