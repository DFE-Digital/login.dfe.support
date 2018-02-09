'use strict';

const express = require('express');
const { isLoggedIn, setCurrentArea } = require('../../infrastructure/utils');
const logger = require('../../infrastructure/logger');

const getSearch = require('./getSearch');
const postSearch = require('./postSearch');

const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.info('Mounting userDevices routes');

  router.use(isLoggedIn);
  router.use(setCurrentArea('tokens'));

  router.get('/', csrf, getSearch);
  router.post('/', csrf, postSearch);

  return router;
};

module.exports = users;
