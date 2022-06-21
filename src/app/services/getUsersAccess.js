const logger = require('./../../infrastructure/logger');
const { getUsersAccessToServiceAtOrganisation } = require('./../../infrastructure/access');
const { getClientByServiceId } = require('./../../infrastructure/applications');
const { getOrganisationById } = require('../../infrastructure/organisations');
const { getUserOrganisation } = require('../../infrastructure/organisations');
const { usersByIds } = require('../../infrastructure/directories');

const getUsersAccess = async (req, res) => {
  const { uid, sid, oid } = req.params;
  const { correlationId, clientCorrelationId } = req;

  try {
    logger.info(`Getting user ${uid}'s access to ${sid} within organisation ${oid} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId})`, {
      correlationId,
      clientCorrelationId
    });

    const service = await getClientByServiceId(sid);

    const access = await getUsersAccessToServiceAtOrganisation(uid, service.id, oid, correlationId);
    if (!access) {
      return res.status(404).send();
    }

    const organisation = await getOrganisationById(oid, correlationId);
    if (!organisation) {
        return res.status(404).send();
    }
 
    // const userOrganisation = await getUserOrganisation(uid, oid, correlationId);
    // if (!userOrganisation) {
    //     return res.status(404).send();
    // }

    return res.json({
      userId: access.userId,
      userLegacyNumericId: 'userLegacyNumericId', // userOrganisation.number_identifier,
      userLegacyTextId: 'userLegacyTextId', // userOrganisation.text_identifier,
      serviceId: access.serviceId,
      organisationId: access.organisationId,
      organisationLegacyId: 'organisationLegacyId', // organisation.organisationLegacyId,
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
