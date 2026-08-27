const express = require("express");
const { asyncWrapper } = require("login.dfe.express-error-handling");
const inviteUser = require("./inviteUser");
const getUsersAccess = require("./getUsersAccess");
const getServiceRoles = require("./getServiceRoles");
const requestServiceAccess = require("./requestServiceAccess");

const area = () => {
  const router = express.Router();

  router.get("/:clientid/roles", asyncWrapper(getServiceRoles));

  router.post("/:sid/invitations", asyncWrapper(inviteUser));
  router.get(
    "/:sid/organisations/:oid/users/:uid",
    asyncWrapper(getUsersAccess),
  );

  router.post("/:sid/access-requests", asyncWrapper(requestServiceAccess));

  return router;
};

module.exports = area;
