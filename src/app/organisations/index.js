const express = require("express");
const { asyncWrapper } = require("login.dfe.express-error-handling");
const getUsersByRoles = require("./getUsersByRoles");

const area = () => {
  const router = express.Router();

  router.get("/:id/users", asyncWrapper(getUsersByRoles));

  return router;
};

module.exports = area;
