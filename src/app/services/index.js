const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const listServices = require('./listServices');
const getService = require('./getService');
const updateService = require('./updateService');
const createService = require('./createService');
const regenerateSecret = require('./regenerateSecret');
const inviteUser = require('./inviteUser');
const getUsersAccess = require('./getUsersAccess');

const area = () => {
  const router = express.Router();

  router.get('/', asyncWrapper(listServices));
  router.get('/:clientid', asyncWrapper(getService));
  router.patch('/:clientid', asyncWrapper(updateService));
  router.post('/', asyncWrapper(createService));
  router.post('/:clientid/regenerate-secret', asyncWrapper(regenerateSecret));

  router.post('/:sid/invitations', asyncWrapper(inviteUser));
  router.get('/:sid/organisations/:oid/users/:uid', asyncWrapper(getUsersAccess));
  // router.get('/:sid/users/:uid', asyncWrapper(getUsersAccess)); // TODO: Allow this once users can be mapped without organisation

  return router;
};

module.exports = area;
