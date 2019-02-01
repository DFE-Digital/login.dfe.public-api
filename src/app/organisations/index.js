const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const getOrganisatiobByTypeAndIdentifier = require('./getOrganisatiobByTypeAndIdentifier');
const upsertAnnouncement = require('./upsertAnnouncement');
const deleteAnnouncement = require('./deleteAnnouncement');


const area = () => {
  const router = express.Router();

  router.get('/find-by-type/:type/:identifier', asyncWrapper(getOrganisatiobByTypeAndIdentifier));

  router.post('/announcements', asyncWrapper(upsertAnnouncement));
  router.delete('/announcements/:messageId', asyncWrapper(deleteAnnouncement));

  return router;
};

module.exports = area;
