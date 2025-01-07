const logger = require("./../../infrastructure/logger");
const {
  getOrganisationsAssociatedWithUserV2,
} = require("../../infrastructure/organisations");

const getUserOrganisationsV2 = async (req, res) => {
  const uid = req.params.id;
  const { correlationId, clientCorrelationId } = req;
  try {
    logger.info(
      `Getting organisations for user ${uid} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId}`,
      {
        correlationId,
        clientCorrelationId,
      },
    );

    const userOrganisations = await getOrganisationsAssociatedWithUserV2(
      uid,
      correlationId,
    );
    if (!userOrganisations) {
      return res.status(404).send();
    }
    const organisations = userOrganisations.map((x) => x.organisation);
    return res.send(organisations);
  } catch (e) {
    logger.info(
      `Error getting organisations for user ${uid} (correlationId ${correlationId}, client correlationId: ${clientCorrelationId}) - ${e.message}`,
      {
        correlationId,
        clientCorrelationId,
        stack: e.stack,
      },
    );
    throw e;
  }
};

module.exports = getUserOrganisationsV2;
