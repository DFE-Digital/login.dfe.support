const express = require("express");
const { asyncWrapper } = require("login.dfe.express-error-handling");
const {
  isLoggedIn,
  setCurrentArea,
  isServiceCreator,
} = require("../../infrastructure/utils");
const logger = require("../../infrastructure/logger");

const getChooseServiceType = require("./getChooseServiceType");
const postChooseServiceType = require("./postChooseServiceType");

const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.debug("Mounting services routes");

  router.use(isLoggedIn);
  router.use(isServiceCreator);
  router.use(setCurrentArea("services"));

  router.get("/choose-type", csrf, asyncWrapper(getChooseServiceType));
  router.post("/choose-type", csrf, asyncWrapper(postChooseServiceType));

  return router;
};

module.exports = users;
