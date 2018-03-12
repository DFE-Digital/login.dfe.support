'use strict';

/* eslint-disable no-underscore-dangle */

const url = require('url');
const passport = require('passport');
const config = require('./../../infrastructure/config');

const signUserOut = (req, res) => {
  if (req.user.id_token) {
    const idToken = req.user.id_token;
    const issuer = passport._strategies.oidc._issuer;
    const returnUrl = `${config.hostingEnvironment.protocol}://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}/signout/complete`;
    req.logout();
    res.redirect(url.format(Object.assign(url.parse(issuer.end_session_endpoint), {
      search: null,
      query: {
        id_token_hint: idToken,
        post_logout_redirect_uri: returnUrl,
      },
    })));
  } else {
    res.redirect('/');
  }
};

module.exports = signUserOut;

