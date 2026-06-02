const express = require("express");
const { asyncWrapper } = require("login.dfe.express-helpers/error-handling");
const { get } = require("./collectOrgsWithoutUsers");

const router = express.Router({ mergeParams: true });

const reportRoutes = (csrf) => {
  router.get("/collect-orgs", csrf, asyncWrapper(get));
  return router;
};

module.exports = reportRoutes;
