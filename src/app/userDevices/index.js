'use strict';

const express = require('express');
const { isLoggedIn, setCurrentArea } = require('../../infrastructure/utils');
const logger = require('../../infrastructure/logger');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const getSearch = require('./getSearch');
const getUserDevice = require('./getUserDevice');
const getResyncToken = require('./getResyncToken');
const getUnlockCode = require('./getUnlockToken');
const getDeactivateToken = require('./getDeactivateToken');
const postUnlockToken = require('./postUnlockToken');
const postResyncToken = require('./postResyncToken');
const postDeactivateToken = require('./postDeactivateToken');
const postSearch = require('./postSearch');

const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.info('Mounting userDevices routes');

  router.use(isLoggedIn);
  router.use(setCurrentArea('tokens'));

  router.get('/', csrf, asyncWrapper(getSearch));
  router.get('/:serialNumber', csrf, asyncWrapper(getUserDevice));
  router.get('/:serialNumber/resync', csrf, asyncWrapper(getResyncToken));
  router.get('/:serialNumber/unlock', csrf, asyncWrapper(getUnlockCode));
  router.get('/:serialNumber/deactivate', csrf, asyncWrapper(getDeactivateToken));
  router.post('/:serialNumber/resync', csrf, asyncWrapper(postResyncToken));
  router.post('/:serialNumber/unlock', csrf, asyncWrapper(postUnlockToken));
  router.post('/:serialNumber/deactivate', csrf, asyncWrapper(postDeactivateToken));
  router.post('/', csrf, postSearch);

  return router;
};

module.exports = users;
