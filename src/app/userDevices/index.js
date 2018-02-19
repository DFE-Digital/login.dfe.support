'use strict';

const express = require('express');
const { isLoggedIn, setCurrentArea } = require('../../infrastructure/utils');
const logger = require('../../infrastructure/logger');

const getSearch = require('./getSearch');
const getUserDevice = require('./getUserDevice');
const getResyncToken = require('./getResyncToken');
const getUnlockCode = require('./getUnlockCode');
const postResyncToken = require('./postResyncToken');
const postSearch = require('./postSearch');

const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.info('Mounting userDevices routes');

  router.use(isLoggedIn);
  router.use(setCurrentArea('tokens'));

  router.get('/', csrf, getSearch);
  router.get('/:serialNumber/:uid', csrf, getUserDevice);
  router.get('/:serialNumber/resync/:uid', csrf, getResyncToken);
  router.get('/:serialNumber/unlock/:uid', csrf, getUnlockCode);
  router.post('/:serialNumber/resync/:uid', csrf, postResyncToken);
  router.post('/', csrf, postSearch);

  return router;
};

module.exports = users;
