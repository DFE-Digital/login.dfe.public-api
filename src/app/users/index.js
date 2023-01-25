const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');
const getServiceUsers = require('./getServiceUsers');

const getUserOrganisations = require('./getUsersOrganisations');
const getUserOrganisationsV2 = require('./getUsersOrganisationsV2');

const getApprovers = require('./getApprovers');

const area = () => {
  const router = express.Router();

  router.get('/:id/organisations', asyncWrapper(getUserOrganisations));
  router.get('/:id/v2/organisations', asyncWrapper(getUserOrganisationsV2));
  router.get('/', asyncWrapper(getServiceUsers));
  router.get('/approvers', asyncWrapper(getApprovers));

  return router;
};

module.exports = area;
