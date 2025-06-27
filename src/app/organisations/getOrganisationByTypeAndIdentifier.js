const logger = require("./../../infrastructure/logger");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");

const getOrgByTypeAndIdentifier = async (req, res) => {
  const { type, identifier } = req.params;
  const { correlationId, clientCorrelationId } = req;

  try {
    logger.info(
      `Getting organisation by type: ${type} and identifier ${identifier} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId})`,
      {
        correlationId,
        clientCorrelationId,
      },
    );

    const organisation = await getOrganisationRaw({
      by: { type, identifierValue: identifier },
    });

    if (!organisation) {
      return res.status(404).send();
    }

    return res.json({
      ...organisation,
    });
  } catch (e) {
    logger.info(
      `Error getting organisation by type: ${type} and identifier ${identifier} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId}) - ${e.message}`,
      {
        correlationId,
        clientCorrelationId,
        stack: e.stack,
      },
    );
    throw e;
  }
};

module.exports = getOrgByTypeAndIdentifier;
