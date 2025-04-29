const express = require("express");
const { asyncWrapper } = require("login.dfe.express-error-handling");

const listServices = require("./listServices");
const getService = require("./getService");
const updateService = require("./updateService");
const regenerateSecret = require("./regenerateSecret");
const inviteUser = require("./inviteUser");
const getUsersAccess = require("./getUsersAccess");
const deleteService = require("./deleteService");
const serviceGrants = require("./serviceGrants");
const serviceGrantTokens = require("./serviceGrantTokens");
const getServiceRoles = require("./getServiceRoles");

const area = () => {
  const router = express.Router();

  router.get("/", asyncWrapper(listServices));
  router.get("/:clientid", asyncWrapper(getService));
  router.patch("/:clientid", asyncWrapper(updateService));
  router.delete("/:clientid", asyncWrapper(deleteService));
  router.post("/:clientid/regenerate-secret", asyncWrapper(regenerateSecret));
  router.get("/:clientid/roles", asyncWrapper(getServiceRoles));

  router.post("/:sid/invitations", asyncWrapper(inviteUser));
  router.get(
    "/:sid/organisations/:oid/users/:uid",
    asyncWrapper(getUsersAccess),
  );
  // router.get('/:sid/users/:uid', asyncWrapper(getUsersAccess)); // TODO: Allow this once users can be mapped without organisation

  router.get("/:sid/grants", asyncWrapper(serviceGrants));
  router.get("/:sid/grants/:grantId/tokens", asyncWrapper(serviceGrantTokens));

  return router;
};

module.exports = area;
