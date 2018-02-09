'use strict';

const express = require('express');
const { isLoggedIn, setCurrentArea } = require('../../infrastructure/utils');
const logger = require('../../infrastructure/logger');

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

const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.info('Mounting user routes');

  router.use(isLoggedIn);
  router.use(setCurrentArea('users'));

  router.get('/', csrf, getSearch);
  router.post('/', csrf, postSearch);

  router.get('/new-k2s-user', csrf, getNewUserK2S);
  router.post('/new-k2s-user', csrf, postNewUserK2S);
  router.get('/assign-digipass', csrf, (req, res) => {
    res.send('TODO');
  });

  router.get('/:uid', (req, res) => {
    res.redirect(`/users/${req.params.uid}/services`);
  });
  router.get('/:uid/services', csrf, getServices);
  router.get('/:uid/audit', csrf, getAudit);

  router.get('/:uid/edit-profile', csrf, getEditProfile);
  router.post('/:uid/edit-profile', csrf, postEditProfile);

  router.get('/:uid/confirm-deactivation', csrf, getConfirmDeactivate);
  router.post('/:uid/confirm-deactivation', csrf, postConfirmDeactivate);

  router.get('/:uid/confirm-reactivation', csrf, getConfirmReactivate);
  router.post('/:uid/confirm-reactivation', csrf, postConfirmReactivate);

  return router;
};

module.exports = users;
