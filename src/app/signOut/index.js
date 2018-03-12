'use strict';

const express = require('express');
const { isLoggedIn } = require('../../infrastructure/utils');
const logger = require('../../infrastructure/logger');
const signOutUser = require('./signOut');
const complete = require('./complete');

const router = express.Router({ mergeParams: true });

const signout = () => {
  logger.info('Mounting signOut route');
  router.get('/', isLoggedIn, signOutUser);
  router.get('/complete', complete);
  return router;
};

module.exports = signout;
