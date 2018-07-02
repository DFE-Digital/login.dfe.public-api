const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const inviteUser = require('./inviteUser');

const area = () => {
  const router = express.Router();

  router.post('/:sid/invitations', asyncWrapper(inviteUser));

  return router;
};

module.exports = area;
