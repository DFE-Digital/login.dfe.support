'use strict';

const express = require('express');
const { isLoggedIn, setCurrentArea } = require('../../infrastructure/utils');
const logger = require('../../infrastructure/logger');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const search = require('./search');
const organisationUsers = require('./organisationUsers');
const webServiceSync = require('./webServiceSync');
const getppsyncStatus = require('./getppsyncStatus');
const postppsyncStatus = require('./postPpsyncStatus');


const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.info('Mounting organisations routes');

  router.use(isLoggedIn);
  router.use(setCurrentArea('organisations'));

  router.get('/', csrf, asyncWrapper(search.get));
  router.post('/', csrf, asyncWrapper(search.post));
  // DO NOT UNCOMMENT
  router.get('/run-pp-sync', csrf, asyncWrapper(getppsyncStatus));
  router.post('/run-pp-sync', csrf, asyncWrapper(postppsyncStatus));


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
