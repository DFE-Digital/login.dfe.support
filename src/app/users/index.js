'use strict';

const express = require('express');
const { isLoggedIn } = require('../../infrastructure/utils');
const logger = require('../../infrastructure/logger');

const router = express.Router({ mergeParams: true });

const users = () => {
  logger.info('Mounting user routes');

  router.get('/', isLoggedIn, (req, res) => {
    res.send('TODO');
  });

  return router;
};

module.exports = users;
