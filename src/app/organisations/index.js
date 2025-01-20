'use strict';

const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');
const { isLoggedIn, setCurrentArea } = require('../../infrastructure/utils');
const logger = require('../../infrastructure/logger');

const search = require('./search');
const organisationUsers = require('./organisationUsers');
const webServiceSync = require('./webServiceSync');
const getppsyncStatus = require('./getppsyncStatus');
const postppsyncStatus = require('./postPpsyncStatus');
const getCreateOrganisation = require('./getCreateOrganisation');
const postCreateOrganisation = require('./postCreateOrganisation');
const getConfirmCreateOrganisation = require('./getConfirmCreateOrganisation');
const postConfirmCreateOrganisation = require('./postConfirmCreateOrganisation');

const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.debug('Mounting organisations routes');

  router.use(isLoggedIn);
  router.use(setCurrentArea('organisations'));

  router.get('/', csrf, asyncWrapper(search.get));
  router.post('/', csrf, asyncWrapper(search.post));
  // DO NOT UNCOMMENT
  router.get('/run-pp-sync', csrf, asyncWrapper(getppsyncStatus));
  router.post('/run-pp-sync', csrf, asyncWrapper(postppsyncStatus));

  router.get('/create-org', csrf, asyncWrapper(getCreateOrganisation));
  router.post('/create-org', csrf, asyncWrapper(postCreateOrganisation));
  router.get('/confirm-create-org', csrf, asyncWrapper(getConfirmCreateOrganisation));
  router.post('/confirm-create-org', csrf, asyncWrapper(postConfirmCreateOrganisation));

  router.get('/:id', (req, res) => {
    res.redirect('users');
  });

  router.get('/:id/users', csrf, asyncWrapper(organisationUsers.get));
  router.post('/:id/users', csrf, asyncWrapper(organisationUsers.post));
  router.get('/:id/web-service-sync', csrf, asyncWrapper(webServiceSync.get));
  router.post('/:id/web-service-sync', csrf, asyncWrapper(webServiceSync.post));

  return router;
};

module.exports = users;
