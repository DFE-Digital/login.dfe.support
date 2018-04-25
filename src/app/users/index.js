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
const getEditEmail = require('./getEditEmail');
const postEditEmail = require('./postEditEmail');
const getConfirmDeactivate = require('./getConfirmDeactivate');
const postConfirmDeactivate = require('./postConfirmDeactivate');
const getConfirmReactivate = require('./getConfirmReactivate');
const postConfirmReactivate = require('./postConfirmReactivate');
const getNewUser = require('./getNewUser');
const postNewUser = require('./postNewUser');
const getAssociateOrganisation = require('./getAssociateOrganisation');
const postAssociateOrganisation = require('./postAssociateOrganisation');
const getOrganisationPermissions = require('./getOrganisationPermissions');
const postOrganisationPermissions = require('./postOrganisationPermissions');
const getConfirmNewUser = require('./getConfirmNewUser');
const postConfirmNewUser = require('./postConfirmNewUser');
const getNewUserK2S = require('./getNewUserK2S');
const postNewUserK2S = require('./postNewUserK2S');
const getAssignDigipass = require('./getAssignDigipass');
const postAssignDigipass = require('./postAssignDigipass');
const getConfirmAssignToken = require('./getConfirmAssignToken');
const postConfirmAssignToken = require('./postConfirmAssignToken');
const getConfirmNewK2sUser = require('./getConfirmNewK2sUser');
const postConfirmNewK2sUser = require('./postConfirmNewK2sUser');
const postCancelChangeEmail = require('./postCancelChangeEmail');

const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.info('Mounting user routes');

  router.use(isLoggedIn);
  router.use(setCurrentArea('users'));

  router.get('/', csrf, asyncWrapper(getSearch));
  router.post('/', csrf, asyncWrapper(postSearch));

  router.get('/new-user', csrf, asyncWrapper(getNewUser));
  router.post('/new-user', csrf, asyncWrapper(postNewUser));
  router.get('/associate-organisation', csrf, asyncWrapper(getAssociateOrganisation));
  router.post('/associate-organisation', csrf, asyncWrapper(postAssociateOrganisation));
  router.get('/organisation-permissions', csrf, asyncWrapper(getOrganisationPermissions));
  router.post('/organisation-permissions', csrf, asyncWrapper(postOrganisationPermissions));
  router.get('/confirm-new-user', csrf, asyncWrapper(getConfirmNewUser));
  router.post('/confirm-new-user', csrf, asyncWrapper(postConfirmNewUser));
  router.get('/new-k2s-user', csrf, asyncWrapper(getNewUserK2S));
  router.post('/new-k2s-user', csrf, asyncWrapper(postNewUserK2S));
  router.get('/assign-digipass', csrf, asyncWrapper(getAssignDigipass));
  router.post('/assign-digipass', csrf, asyncWrapper(postAssignDigipass));
  router.get('/:uid/assign-digipass/:serviceId', csrf, asyncWrapper(getAssignDigipass));
  router.post('/:uid/assign-digipass/:serviceId', csrf, asyncWrapper(postAssignDigipass));
  router.get('/:uid/assign-digipass/:serviceId/confirm', csrf, asyncWrapper(getConfirmAssignToken));
  router.post('/:uid/assign-digipass/:serviceId/confirm', csrf, asyncWrapper(postConfirmAssignToken));
  router.get('/confirm-new-k2s-user', csrf, asyncWrapper(getConfirmNewK2sUser));
  router.post('/confirm-new-k2s-user', csrf, asyncWrapper(postConfirmNewK2sUser));

  router.get('/:uid', asyncWrapper((req, res) => {
    res.redirect(`/users/${req.params.uid}/services`);
  }));
  router.get('/:uid/services', csrf, asyncWrapper(getServices));
  router.get('/:uid/audit', csrf, asyncWrapper(getAudit));

  router.get('/:uid/edit-profile', csrf, asyncWrapper(getEditProfile));
  router.post('/:uid/edit-profile', csrf, asyncWrapper(postEditProfile));

  router.get('/:uid/edit-email', csrf, asyncWrapper(getEditEmail));
  router.post('/:uid/edit-email', csrf, asyncWrapper(postEditEmail));

  router.get('/:uid/confirm-deactivation', csrf, asyncWrapper(getConfirmDeactivate));
  router.post('/:uid/confirm-deactivation', csrf, asyncWrapper(postConfirmDeactivate));

  router.get('/:uid/confirm-reactivation', csrf, asyncWrapper(getConfirmReactivate));
  router.post('/:uid/confirm-reactivation', csrf, asyncWrapper(postConfirmReactivate));

  router.post('/:uid/cancel-change-email', csrf, asyncWrapper(postCancelChangeEmail));

  return router;
};

module.exports = users;
