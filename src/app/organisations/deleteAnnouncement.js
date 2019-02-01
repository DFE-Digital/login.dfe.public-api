const logger = require('./../../infrastructure/logger');
const { searchForAnnouncements, upsertOrganisationAnnouncement } = require('./../../infrastructure/organisations');

const deleteAnnouncement = async (req, res) => {
  const { correlationId, clientCorrelationId } = req;
  const messageId = req.params.messageId;

  try {
    logger.info(`Deleting announcement with message id ${messageId} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId})`, {
      correlationId,
      clientCorrelationId
    });

    const result = await searchForAnnouncements(messageId, correlationId);
    const announcement = result && result.announcements && result.announcements.length > 0 ? result.announcements[0] : undefined;
    if (!announcement) {
      return res.status(404).send();
    }

    await upsertOrganisationAnnouncement(
      announcement.organisationId,
      announcement.originId,
      announcement.type,
      announcement.title,
      announcement.summary,
      announcement.body,
      announcement.publishedAt,
      announcement.expiresAt,
      false,
      correlationId
    );
    return res.status(204).send();
  } catch (e) {
    logger.info(`Error deleting announcement with message id ${messageId} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId})`, {
      correlationId,
      clientCorrelationId
    });
    throw e;
  }
};
module.exports = deleteAnnouncement;
