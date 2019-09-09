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

  router.get('/request/:id', csrf, asyncWrapper(getRequest));
  router.post('/request/:id', csrf, asyncWrapper(postRequest));

  // Approve/Reject org requests
  router.get('/:orgId/requests/:rid', csrf, asyncWrapper(getReviewOrganisationRequest));
  router.post('/:orgId/requests/:rid', csrf, asyncWrapper(postReviewOrganisationRequest));
  router.get('/:orgId/requests/:rid/rejected', csrf, asyncWrapper(getRejectOrganisationRequest));
  router.post('/:orgId/requests/:rid/rejected', csrf, asyncWrapper(postRejectOrganisationRequest));

  return router;
};

module.exports = users;
