'use strict';

const express = require('express');
const { isLoggedIn } = require('../../infrastructure/utils');
const logger = require('../../infrastructure/logger');

const router = express.Router({ mergeParams: true });

const users = (csrf) => {
  logger.info('Mounting user routes');

  router.use(isLoggedIn);

  router.get('/', csrf, (req, res) => {
    res.render('users/views/search', {
      csrfToken: req.csrfToken(),
      users: [
        {
          name: 'Wade Wilson',
          email: 'deadpool@x-force.test',
          organisation: {
            name: 'X-Force'
          },
          lastLogin: new Date(2018, 0, 11, 11, 30, 57),
          status: {
            description: 'Active'
          }
        }
      ]
    })
  });

  return router;
};

module.exports = users;
