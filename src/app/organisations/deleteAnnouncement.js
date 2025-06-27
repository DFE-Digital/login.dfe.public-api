const logger = require("./../../infrastructure/logger");
const {
  addOrganisationAnnouncementRaw,
  getPaginatedOrganisationsAnnouncementsRaw,
} = require("login.dfe.api-client/organisations");

const deleteAnnouncement = async (req, res) => {
  const { correlationId, clientCorrelationId } = req;
  const messageId = req.params.messageId;

  try {
    logger.info(
      `Deleting announcement with message id ${messageId} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId})`,
      {
        correlationId,
        clientCorrelationId,
      },
    );

    const result = await getPaginatedOrganisationsAnnouncementsRaw({
      announcementOriginId: messageId,
    });

    const announcement =
      result && result.announcements && result.announcements.length > 0
        ? result.announcements[0]
        : undefined;
    if (!announcement) {
      return res.status(404).send();
    }

    await addOrganisationAnnouncementRaw({
      organisationId: announcement.organisationId,
      announcementOriginId: announcement.originId,
      announcementType: announcement.type,
      announcementTitle: announcement.title,
      announcementSummary: announcement.summary,
      announcementBody: announcement.body,
      isAnnouncementPublished: false,
      expiresAt: announcement.expiresAt,
      publishedAt: announcement.publishedAt,
    });

    return res.status(204).send();
  } catch (e) {
    logger.info(
      `Error deleting announcement with message id ${messageId} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId})`,
      {
        correlationId,
        clientCorrelationId,
      },
    );
    throw e;
  }
};
module.exports = deleteAnnouncement;
