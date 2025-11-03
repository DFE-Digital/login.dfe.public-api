const express = require("express");
const { asyncWrapper } = require("login.dfe.express-error-handling");

const getService = require("./getService");
const inviteUser = require("./inviteUser");
const getUsersAccess = require("./getUsersAccess");
const getServiceRoles = require("./getServiceRoles");

const area = () => {
  const router = express.Router();

  router.get("/:clientid", asyncWrapper(getService));
  router.get("/:clientid/roles", asyncWrapper(getServiceRoles));

  router.post("/:sid/invitations", asyncWrapper(inviteUser));
  router.get(
    "/:sid/organisations/:oid/users/:uid",
    asyncWrapper(getUsersAccess),
  );
  // router.get('/:sid/users/:uid', asyncWrapper(getUsersAccess)); // TODO: Allow this once users can be mapped without organisation

  return router;
};

module.exports = area;
