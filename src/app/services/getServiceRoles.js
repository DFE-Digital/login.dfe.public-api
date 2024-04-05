const logger = require('../../infrastructure/logger');
const { getClientByServiceId } = require('../../infrastructure/applications');
const { getRoles } = require('../../infrastructure/access');

const getServiceRoles = async (req, res) => {
  const { correlationId, clientCorrelationId, client } = req;
  const requestedClientId = req.params.clientid;

  const clientServiceId = client.id;
  const clientId = client.relyingParty.client_id;

  logger.info(`${clientId} is attempting to get service roles for: ${requestedClientId} (correlationId: ${correlationId}, clientCorrelationId: ${clientCorrelationId})`, {
    correlationId,
    clientCorrelationId,
    requester: clientId,
    requestedClientId,
  });

  const service = await getClientByServiceId(requestedClientId, correlationId);
  if (!service) {
    return res.status(404).send();
  }

  if (service.relyingParty.client_id !== clientId && service.parentId !== clientServiceId) {
    return res.status(403).send();
  }

  const roles = await getRoles(service.id, correlationId) ?? [];

  return res.json(roles);
};

module.exports = getServiceRoles;
