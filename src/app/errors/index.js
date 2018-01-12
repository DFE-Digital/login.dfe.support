'use strict';

const express = require('express');
const logger = require('../../infrastructure/logger');

const router = express.Router({ mergeParams: true });

const errors = () => {
  logger.info('Mounting error routes');

  router.get('/not-authorised', (req, res) => {
    res.status(401).render('errors/views/notAuthorised');
  });

  return router;
};

module.exports = errors;
