'use strict';

const express = require('express');
const logger = require('../../infrastructure/logger');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const router = express.Router({ mergeParams: true });

const errors = () => {
  logger.info('Mounting error routes');

  router.get('/not-authorised', asyncWrapper((req, res) => {
    res.status(401).render('errors/views/notAuthorised');
  }));

  router.get('/not-found', asyncWrapper((req, res) => {
    res.status(404).render('errors/views/notFound');
  }));

  return router;
};

module.exports = errors;
