const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');
const { body } = require('express-validator');
const getOrganisatiobByTypeAndIdentifier = require('./getOrganisatiobByTypeAndIdentifier');
const upsertAnnouncement = require('./upsertAnnouncement');
const deleteAnnouncement = require('./deleteAnnouncement');
const getUsersByRoles = require('./getUsersByRoles');
const getUserOverview = require('./getUserOverview');

const area = () => {
  const router = express.Router();

  router.get('/find-by-type/:type/:identifier', asyncWrapper(getOrganisatiobByTypeAndIdentifier));

  router.post('/announcements',
    body('messageId', 'messageId must be a valid UUID').isUUID(),
    body('urn', 'urn must be numeric type').if(body('uid').isEmpty()).isNumeric(),
    body('uid', 'uid must be a valid UUID').if(body('urn').isEmpty()).isUUID(),
    body('type', 'type must be an integer').isInt(),
    body('title', 'title field cannot be more than 255 characters').escape(),
    body('summary', 'summary field cannot be more than 340 characters').escape(),
    body('body', 'body field cannot be more than 5000 characters').escape(),
    body('publishedAt', 'publishedAt is not a valid ISO8601 format').isISO8601(),
    body('expiresAt', 'expiresAt is not a valid ISO8601 format').optional({ checkFalsy: true, nullable: true }).isISO8601(),
    asyncWrapper(upsertAnnouncement));

  router.delete('/announcements/:messageId', asyncWrapper(deleteAnnouncement));
  router.get('/:id/users', asyncWrapper(getUsersByRoles));
  router.get('/user-overview/:id', asyncWrapper(getUserOverview));

  return router;
};

module.exports = area;
