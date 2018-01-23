'use strict';

const express = require('express');
const { isLoggedIn, setCurrentArea } = require('../../infrastructure/utils');
const logger = require('../../infrastructure/logger');

const getSearch = require('./getSearch');
const postSearch = require('./postSearch');
const getServices = require('./getServices');

const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.info('Mounting user routes');

  router.use(isLoggedIn);
  router.use(setCurrentArea('users'));

  router.get('/', csrf, getSearch);
  router.post('/', csrf, postSearch);

  router.get('/:uid', (req, res) => {
    res.redirect(`/users/${req.params.uid}/services`);
  });
  router.get('/:uid/services', csrf, getServices);

  return router;
};

module.exports = users;
