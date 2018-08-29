const logger = require('./../../infrastructure/logger');
const { getUsersAccessToServiceAtOrganisation } = require('./../../infrastructure/access');

const getUsersAccess = async (req, res) => {
  const { uid, sid, oid } = req.params;
  const { correlationId, clientCorrelationId } = req;

  try {
    logger.info(`Getting user ${uid}'s access to ${sid} within organisation ${oid} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId})`, {
      correlationId,
      clientCorrelationId
    });

    const access = await getUsersAccessToServiceAtOrganisation(uid, sid, oid, correlationId);
    if (!access) {
      return res.status(404).send();
    }

    return res.json({
      userId: access.userId,
      serviceId: access.serviceId,
      organisationId: access.organisationId,
      roles: access.roles,
      identifiers: access.identifiers,
    });
  } catch (e) {
    logger.info(`Error getting user ${uid}'s access to ${sid} within organisation ${oid} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId}) - ${e.message}`, {
      correlationId,
      clientCorrelationId,
      stack: e.stack,
    });
    throw e;
  }
};

module.exports = getUsersAccess;
