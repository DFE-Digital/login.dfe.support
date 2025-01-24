const express = require("express");
const { isLoggedIn } = require("../../infrastructure/utils");
const logger = require("../../infrastructure/logger");
const signOutUser = require("./signOut");
const complete = require("./complete");
const sessionTimeout = require("./session-timeout");

const router = express.Router({ mergeParams: true });

const signout = () => {
  logger.debug("Mounting signOut route");
  router.get("/", isLoggedIn, signOutUser);
  router.get("/complete", complete);
  router.get("/session-timeout", sessionTimeout);
  return router;
};

module.exports = signout;
