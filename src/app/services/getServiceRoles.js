const logger = require("../../infrastructure/logger");
const {
  getServiceRaw,
  getServiceRolesRaw,
} = require("login.dfe.api-client/services");

const getServiceRoles = async (req, res) => {
  const { correlationId, clientCorrelationId, client } = req;
  const requestedClientId = req.params.clientid;

  const clientServiceId = client.id;
  const clientId = client.relyingParty.client_id;

  logger.info(
    `${clientId} is attempting to get service roles for: ${requestedClientId} (correlationId: ${correlationId}, clientCorrelationId: ${clientCorrelationId})`,
    {
      correlationId,
      clientCorrelationId,
      requester: clientId,
      requestedClientId,
    },
  );

  const service = await getServiceRaw({ by: { clientId: requestedClientId } });
  if (!service) {
    return res.status(404).send();
  }

  if (
    service.relyingParty.client_id !== clientId &&
    service.parentId !== clientServiceId
  ) {
    return res.status(403).send();
  }

  const roles = (await getServiceRolesRaw({ serviceId: service.id })) ?? [];

  return res.json(
    roles.map((role) => ({
      name: role.name,
      code: role.code,
      status: role.status?.id === 1 ? "Active" : "Inactive",
    })),
  );
};

module.exports = getServiceRoles;
