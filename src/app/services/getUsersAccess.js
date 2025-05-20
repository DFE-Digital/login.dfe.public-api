const logger = require("./../../infrastructure/logger");
const { getClientByServiceId } = require("./../../infrastructure/applications");
const { organisation } = require("login.dfe.dao");
const { getUserServiceRaw } = require("login.dfe.api-client/users");
const getUsersAccess = async (req, res) => {
  const { uid, sid, oid } = req.params;
  const { correlationId, clientCorrelationId } = req;

  try {
    logger.info(
      `Getting user ${uid}'s access to ${sid} within organisation ${oid} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId})`,
      {
        correlationId,
        clientCorrelationId,
      },
    );

    const service = await getClientByServiceId(sid);

    const access = await getUserServiceRaw({
      userId: uid,
      serviceId: service.id,
      organisationId: oid,
    });

    if (!access) {
      return res.status(404).send();
    }

    const userOrganisationIdentifer =
      await organisation.getUserOrganisationIdentifiers(uid, oid);
    if (!userOrganisationIdentifer) {
      return res.status(404).send();
    }

    const organisationDetails = await organisation.getOrganisation(oid);
    if (!organisationDetails) {
      return res.status(404).send();
    }

    return res.json({
      userId: access.userId,
      userLegacyNumericId: userOrganisationIdentifer.numericIdentifier,
      userLegacyTextId: userOrganisationIdentifer.textIdentifier,
      serviceId: access.serviceId,
      organisationId: access.organisationId,
      organisationLegacyId: organisationDetails.legacyId,
      organisationIsOnAPAR: organisationDetails.IsOnAPAR,
      roles: access.roles,
      identifiers: access.identifiers,
    });
  } catch (e) {
    logger.info(
      `Error getting user ${uid}'s access to ${sid} within organisation ${oid} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId}) - ${e.message}`,
      {
        correlationId,
        clientCorrelationId,
        stack: e.stack,
      },
    );
    throw e;
  }
};

module.exports = getUsersAccess;
