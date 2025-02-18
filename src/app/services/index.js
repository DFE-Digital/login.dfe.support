const express = require("express");
const { asyncWrapper } = require("login.dfe.express-error-handling");
const { isLoggedIn, setCurrentArea } = require("../../infrastructure/utils");
const logger = require("../../infrastructure/logger");

const getChooseServiceType = require("./getChooseServiceType");
const postChooseServiceType = require("./postChooseServiceType");

const router = express.Router({ mergeParams: true });

const isServiceCreator = (req, res, next) => {
  if (req.user.isServiceCreator) {
    return next();
  }
  return res.status(401).render("errors/views/notAuthorised");
};

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
