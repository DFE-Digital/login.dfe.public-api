const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const getUserOrganisations = require('./getUsersOrganisations');

const area = () => {
  const router = express.Router();

  router.get('/:id/organisations', asyncWrapper(getUserOrganisations));

  return router;
};

module.exports = area;
