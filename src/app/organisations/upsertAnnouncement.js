const { validationResult } = require('express-validator');
const logger = require('./../../infrastructure/logger');
const { getOrganisationByTypeAndIdentifier, upsertOrganisationAnnouncement } = require('./../../infrastructure/organisations');

const getAndValidateModel = (req) => {
  const validTypes = [1, 2, 4, 5];
  const model = {
    announcement: {
      messageId: req.body.messageId,
      urn: req.body.urn,
      uid: req.body.uid,
      type: req.body.type,
      title: req.body.title,
      summary: req.body.summary,
      body: req.body.body,
      publishedAt: req.body.publishedAt,
      expiresAt: req.body.expiresAt,
    },
    errors: [],
  };
  if (!model.announcement.messageId) {
    model.errors.push('messageId must be specified');
  }
  if (!model.announcement.type) {
    model.errors.push('type must be specified');
  } else if (!validTypes.find(vt => vt === model.announcement.type)) {
    model.errors.push(`type must be one of 1, 2, 4, 5. Received ${model.announcement.type}`);
  }
  if (!model.announcement.title) {
    model.errors.push('title must be specified');
  }
  if (!model.announcement.summary) {
    model.errors.push('summary must be specified');
  }
  if (!model.announcement.body) {
    model.errors.push('body must be specified');
  }
  if (!model.announcement.publishedAt) {
    model.errors.push('publishedAt must be specified');
  }
  if (!model.announcement.urn && !model.announcement.uid) {
    model.errors.push('urn or uid must be specified must be specified');
  }
  if (model.announcement.urn && model.announcement.uid) {
    model.errors.push('Can only specify urn or uid, not both');
  }

  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    validationErrors.array().map((e) => e.msg).forEach((element) => {
      model.errors.push(element);
    });
    model.errors.sort();
  }

  return model;
};

const upsertAnnouncement = async (req, res) => {
  const { correlationId, clientCorrelationId } = req;
  const model = getAndValidateModel(req);

  try {
    logger.info(`Upserting announcement with message id ${model.announcement.messageId} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId})`, {
      correlationId,
      clientCorrelationId
    });

    if (model.errors.length > 0) {
      return res.status(400).json({
        reasons: model.errors,
      });
    }

    let organisation;
    if (model.announcement.urn) {
      organisation = await getOrganisationByTypeAndIdentifier('001', model.announcement.urn, correlationId);
    } else {
      organisation = await getOrganisationByTypeAndIdentifier('010', model.announcement.uid, correlationId);
    }

    const announcement = await upsertOrganisationAnnouncement(
      organisation.id,
      model.announcement.messageId,
      model.announcement.type,
      model.announcement.title,
      model.announcement.summary,
      model.announcement.body,
      model.announcement.publishedAt,
      model.announcement.expiresAt || undefined,
      true,
      correlationId);
    return res.status(202).json(announcement);
  } catch (e) {
    logger.info(`Error upserting announcement with message id ${model.announcement.originId} (correlationId: ${correlationId}, client correlationId: ${clientCorrelationId})`, {
      correlationId,
      clientCorrelationId
    });
    throw e;
  }
};
module.exports = upsertAnnouncement;
