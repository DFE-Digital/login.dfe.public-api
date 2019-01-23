const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const inviteUser = require('./inviteUser');
const getUsersAccess = require('./getUsersAccess');
const getNewSecret = require('./getNewSecret');

const area = () => {
  const router = express.Router();

  router.post('/:sid/invitations', asyncWrapper(inviteUser));
  router.get('/:sid/organisations/:oid/users/:uid', asyncWrapper(getUsersAccess));
  // router.get('/:sid/users/:uid', asyncWrapper(getUsersAccess)); // TODO: Allow this once users can be mapped without organisation
  router.get('/generate-secret', asyncWrapper(getNewSecret));
  
  return router;
};

module.exports = area;
