const { getClientByServiceId, destroyService } = require('./../../infrastructure/applications');

const deleteService = async (req, res) => {
  const service = await getClientByServiceId(req.params.clientid);
  if (!service) {
    return res.status(404).send();
  }
  if (service.parentId !== req.client.id) {
    return res.status(403).send();
  }

  await deleteService(service.id, req.correlationId);
  return res.status(202).send();
};
module.exports = deleteService;
