const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const getOrganisatiobByTypeAndIdentifier = require('./getOrganisatiobByTypeAndIdentifier');
const upsertAnnouncement = require('./upsertAnnouncement');


const area = () => {
  const router = express.Router();

  router.get('/find-by-type/:type/:identifier', asyncWrapper(getOrganisatiobByTypeAndIdentifier));

  router.post('/announcements', asyncWrapper(upsertAnnouncement));

  return router;
};

module.exports = area;
