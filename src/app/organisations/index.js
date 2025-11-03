const express = require("express");
const { asyncWrapper } = require("login.dfe.express-error-handling");
const getUsersByRoles = require("./getUsersByRoles");
const getUsersByRolesV2 = require("./getUsersByRolesV2");
const getUserOverview = require("./getUserOverview");

const area = () => {
  const router = express.Router();

  router.get("/:id/users", asyncWrapper(getUsersByRoles));
  router.get("/v2/:id/users", asyncWrapper(getUsersByRolesV2));
  router.get("/user-overview/:id", asyncWrapper(getUserOverview));

  return router;
};

module.exports = area;
