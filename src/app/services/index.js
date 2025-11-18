const express = require("express");
const { asyncWrapper } = require("login.dfe.express-error-handling");
const inviteUser = require("./inviteUser");
const getUsersAccess = require("./getUsersAccess");
const getServiceRoles = require("./getServiceRoles");

const area = () => {
  const router = express.Router();

  router.get("/:clientid/roles", asyncWrapper(getServiceRoles));

  router.post("/:sid/invitations", asyncWrapper(inviteUser));
  router.get(
    "/:sid/organisations/:oid/users/:uid",
    asyncWrapper(getUsersAccess),
  );

  return router;
};

module.exports = area;
