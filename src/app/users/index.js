'use strict';

const express = require('express');
const { isLoggedIn, setCurrentArea } = require('../../infrastructure/utils');
const logger = require('../../infrastructure/logger');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const getSearch = require('./getSearch');
const postSearch = require('./postSearch');
const getServices = require('./getServices');
const getAudit = require('./getAudit');
const getEditProfile = require('./getEditProfile');
const postEditProfile = require('./postEditProfile');
const getConfirmDeactivate = require('./getConfirmDeactivate');
const postConfirmDeactivate = require('./postConfirmDeactivate');
const getConfirmReactivate = require('./getConfirmReactivate');
const postConfirmReactivate = require('./postConfirmReactivate');
const getNewUserK2S = require('./getNewUserK2S');
const postNewUserK2S = require('./postNewUserK2S');
const getAssignDigipass = require('./getAssignDigipass');
const postAssignDigipass = require('./postAssignDigipass');
const getConfirmNewK2sUser = require('./getConfirmNewK2sUser');
const postConfirmNewK2sUser = require('./postConfirmNewK2sUser');

const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.info('Mounting user routes');

  router.use(isLoggedIn);
  router.use(setCurrentArea('users'));

  router.get('/', csrf, asyncWrapper(getSearch));
  router.post('/', csrf, asyncWrapper(postSearch));

  router.get('/new-k2s-user', csrf, asyncWrapper(getNewUserK2S));
  router.post('/new-k2s-user', csrf, asyncWrapper(postNewUserK2S));
  router.get('/assign-digipass', csrf, asyncWrapper(getAssignDigipass));
  router.post('/assign-digipass', csrf, asyncWrapper(postAssignDigipass));
  router.get('/:uid/assign-digipass', csrf, asyncWrapper(getAssignDigipass));
  router.post('/:uid/assign-digipass', csrf, asyncWrapper(postAssignDigipass));
  router.get('/confirm-new-k2s-user', csrf, asyncWrapper(getConfirmNewK2sUser));
  router.post('/confirm-new-k2s-user', csrf, asyncWrapper(postConfirmNewK2sUser));

  router.get('/:uid', asyncWrapper((req, res) => {
    res.redirect(`/users/${req.params.uid}/services`);
  }));
  router.get('/:uid/services', csrf, asyncWrapper(getServices));
  router.get('/:uid/audit', csrf, asyncWrapper(getAudit));

  router.get('/:uid/edit-profile', csrf, asyncWrapper(getEditProfile));
  router.post('/:uid/edit-profile', csrf, asyncWrapper(postEditProfile));

  router.get('/:uid/confirm-deactivation', csrf, asyncWrapper(getConfirmDeactivate));
  router.post('/:uid/confirm-deactivation', csrf, asyncWrapper(postConfirmDeactivate));

  router.get('/:uid/confirm-reactivation', csrf, asyncWrapper(getConfirmReactivate));
  router.post('/:uid/confirm-reactivation', csrf, asyncWrapper(postConfirmReactivate));

  return router;
};

module.exports = users;
