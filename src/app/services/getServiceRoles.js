const logger = require('../../infrastructure/logger');
const { getAllRolesForService } = require('../../infrastructure/applications');

const getServiceRoles = async (req, res) => {

  const { correlationId, clientCorrelationId } = req;
  logger.info(`Getting roles for service with clientId: ${req.params.clientId} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId})`, {
    correlationId,
    clientCorrelationId
  });

  const rolesForService = await getAllRolesForService(req.params.clientId, correlationId);
  return res.send({
    roles: rolesForService.roles
  });

};

module.exports = getServiceRoles;