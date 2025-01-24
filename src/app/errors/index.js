const express = require("express");
const { asyncWrapper } = require("login.dfe.express-error-handling");
const logger = require("../../infrastructure/logger");

const router = express.Router({ mergeParams: true });

const errors = () => {
  logger.debug("Mounting error routes");

  router.get(
    "/not-authorised",
    asyncWrapper((req, res) => {
      res.status(401).render("errors/views/notAuthorised");
    }),
  );

  return router;
};

module.exports = errors;
