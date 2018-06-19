'use strict';

const express = require('express');
const { isLoggedIn, setCurrentArea } = require('../../infrastructure/utils');
const logger = require('../../infrastructure/logger');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const {get: getSearch,post: postSearch} = require('./search');
const {get: getRequest, post: postRequest} = require('./accessRequest');

const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.info('Mounting access requests routes');

  router.use(isLoggedIn);
  router.use(setCurrentArea('accessrequests'));

  router.get('/', csrf, asyncWrapper(getSearch));
  router.post('/', csrf, asyncWrapper(postSearch));

  router.get('/request/:id', csrf, asyncWrapper(getRequest));
  router.post('/request/:id', csrf, asyncWrapper(postRequest));

  return router;
};

module.exports = users;
