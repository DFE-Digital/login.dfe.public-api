const logger = require('../../infrastructure/logger');
const { extractPageParam, extractPageSizeParam } = require('../utils');
const { serviceRoles } = require('../../infrastructure/applications');

const listServiceRoles = async (req, res) => {

  const { correlationId, clientCorrelationId } = req;
  logger.info(`Getting roles for service with clientId ${req.params.cid} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId})`, {
    correlationId,
    clientCorrelationId
  });

  const rolesForService = await serviceRoles(req.params.cid, req.correlationId);
  return res.send({
    roles: rolesForService.roles
  });
};
module.exports = listRoles;
