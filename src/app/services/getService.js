const { getClientByServiceId } = require('./../../infrastructure/applications');

const getService = async (req, res) => {
  const service = await getClientByServiceId(req.params.clientid);
  if (!service) {
    return res.status(404).send();
  }
  if (service.parentId !== req.client.id) {
    return res.status(403).send();
  }
  return res.send({
    name: service.name,
    description: service.description,
    clientId: service.relyingParty.client_id,
    redirectUris: service.relyingParty.redirect_uris,
  });
};
module.exports = getService;
