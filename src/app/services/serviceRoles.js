const logger = require('../../infrastructure/logger');
const { extractPageParam, extractPageSizeParam } = require('../utils');
const { listServiceRoles } = require('../../infrastructure/applications');

const listServiceRoles = async (req, res) => {

  const { correlationId, clientCorrelationId } = req;
  logger.info(`Getting roles for service with clientId ${req.params.cid} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId})`, {
    correlationId,
    clientCorrelationId
  });

  const serviceRoles = await listServiceRoles(req.params.cid, req.correlationId);
  return res.send({
    roles: serviceRoles.roles
  });
};
module.exports = listRoles;
