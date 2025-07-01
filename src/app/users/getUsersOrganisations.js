const logger = require("./../../infrastructure/logger");
const { getUserOrganisationsRaw } = require("login.dfe.api-client/users");

const getUserOrganisations = async (req, res) => {
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

    let userOrganisations = await getUserOrganisationsRaw({ userId: uid });
    // Filter out orgs with status of 0.  This is mostly to remove the hidden id-only org, if present.
    if (userOrganisations.length > 0) {
      userOrganisations = userOrganisations.filter(
        (org) => org.organisation.status.id !== 0,
      );
    }

    if (!userOrganisations || userOrganisations.length === 0) {
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

module.exports = getUserOrganisations;
