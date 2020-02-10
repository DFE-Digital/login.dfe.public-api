const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const getOrganisatiobByTypeAndIdentifier = require('./getOrganisatiobByTypeAndIdentifier');
const upsertAnnouncement = require('./upsertAnnouncement');
const deleteAnnouncement = require('./deleteAnnouncement');
const getUsersByRoles = require('./getUsersByRoles');
const getUserOverview = require('./getUserOverview');


const area = () => {
  const router = express.Router();

  router.get('/find-by-type/:type/:identifier', asyncWrapper(getOrganisatiobByTypeAndIdentifier));

  router.post('/announcements', asyncWrapper(upsertAnnouncement));
  router.delete('/announcements/:messageId', asyncWrapper(deleteAnnouncement));
  router.get('/:id/users', asyncWrapper(getUsersByRoles));
  router.get('/user-overview/:id', asyncWrapper(getUserOverview));

  return router;
};

module.exports = area;
