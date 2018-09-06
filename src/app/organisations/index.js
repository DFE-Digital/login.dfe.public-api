const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const getOrganisatiobByTypeAndIdentifier = require('./getOrganisatiobByTypeAndIdentifier');


const area = () => {
  const router = express.Router();

  router.get('/find-by-type/:type/:identifier', asyncWrapper(getOrganisatiobByTypeAndIdentifier));

  return router;
};

module.exports = area;
