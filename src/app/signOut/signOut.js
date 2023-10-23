'use strict';

/* eslint-disable no-underscore-dangle */

const url = require('url');
const passport = require('passport');
const config = require('./../../infrastructure/config');
const logger = require('../../infrastructure/logger');

const logout = (req, res) => {
  req.logout(() => {
    logger.info('user logged out.');
  });
  req.session = null; // Needed to clear session and completely logout
};

const signUserOut = (req, res) => {
  if (req.user && req.user.id_token) {
    const idToken = req.user.id_token;
    const issuer = passport._strategies.oidc._issuer;
    let returnUrl = `${config.hostingEnvironment.protocol}://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}/signout/complete`;

    if (req.query.timeout === '1') {
      returnUrl = `${config.hostingEnvironment.protocol}://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}/signout/session-timeout`;
    }

    logout(req, res);
    res.redirect(url.format(Object.assign(url.parse(issuer.end_session_endpoint), {
      search: null,
      query: {
        id_token_hint: idToken,
        post_logout_redirect_uri: returnUrl,
      },
    })));
  } else {
    logout(req, res);
    res.redirect('/');
  }
};

module.exports = signUserOut;
