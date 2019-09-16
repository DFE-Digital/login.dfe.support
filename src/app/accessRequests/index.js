'use strict';

const express = require('express');
const { isLoggedIn, setCurrentArea } = require('../../infrastructure/utils');
const logger = require('../../infrastructure/logger');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const {get: getSearch,post: postSearch} = require('./search');
const {get: getRequest, post: postRequest} = require('./accessRequest');

const getOrganisationRequests = require('./getOrganisationRequests');
const { get: getReviewOrganisationRequest, post: postReviewOrganisationRequest } = require('./reviewOrganisationRequest');
const { get: getRejectOrganisationRequest, post: postRejectOrganisationRequest } = require('./rejectOrganisationRequest');

const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.info('Mounting accessRequests routes');

  router.use(isLoggedIn);
  router.use(setCurrentArea('accessRequests'));

  router.get('/', csrf, asyncWrapper(getOrganisationRequests));

  router.get('/:rid/review', csrf, asyncWrapper(getReviewOrganisationRequest));

  return router;
};

module.exports = users;
