const logger = require('../../infrastructure/logger');
const { extractPageParam, extractPageSizeParam } = require('../utils');
const { getServiceRoles } = require('../../infrastructure/applications');

const getServiceRoles = async (req, res) => {

  const { correlationId, clientCorrelationId } = req;
  logger.info(`Getting roles for service with clientId ${req.params.cid} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId})`, {
    correlationId,
    clientCorrelationId
  });

  const rolesForService = await getServiceRoles(req.params.cid, req.correlationId);
  return res.send({
    roles: rolesForService.roles
  });
};
module.exports = getServiceRoles;
