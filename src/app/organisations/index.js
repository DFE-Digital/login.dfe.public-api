const express = require("express");
const { asyncWrapper } = require("login.dfe.express-error-handling");
const getUsersByRoles = require("./getUsersByRoles");
const getUserOverview = require("./getUserOverview");

const area = () => {
  const router = express.Router();

  router.get("/:id/users", asyncWrapper(getUsersByRoles));
  router.get("/user-overview/:id", asyncWrapper(getUserOverview));

  return router;
};

module.exports = area;
