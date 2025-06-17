const logger = require("./../../infrastructure/logger");
const {
  getOrganisationsAssociatedWithUser,
} = require("../../infrastructure/organisations");

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

    let userOrganisations = await getOrganisationsAssociatedWithUser(
      uid,
      correlationId,
    );
    // TODO move filtering into getOrganisationsAssociatedWithUser with optional parameter.
    // Make filtering the default and you have to opt in to get it unfiltered
    // Filter out orgs with status of 0.  This is mostly to remove the hidden id-only org, if present.
    if (userOrganisations.length > 0) {
      userOrganisations = userOrganisations.filter(
        (org) => org.organisation.status !== 0,
      );
    }
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

module.exports = getUserOrganisations;
