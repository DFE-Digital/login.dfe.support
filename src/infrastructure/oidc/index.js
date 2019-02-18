/* eslint-disable no-param-reassign */
const config = require('../config');
const passport = require('passport');
const { Strategy, Issuer } = require('openid-client');
const logger = require('../logger');
const { getUserSupportClaims } = require('./../supportClaims');
const asyncRetry = require('login.dfe.async-retry');

const getPassportStrategy = async () => {

  Issuer.defaultHttpOptions = { timeout: 10000 };
  const issuer = await asyncRetry(async () => await Issuer.discover(config.identifyingParty.url), asyncRetry.strategies.apiStrategy);

  const client = new issuer.Client({
    client_id: config.identifyingParty.clientId,
    client_secret: config.identifyingParty.clientSecret,
  });
  if (config.identifyingParty.clockTolerance && config.identifyingParty.clockTolerance > 0) {
    client.CLOCK_TOLERANCE = config.identifyingParty.clockTolerance;
  }

  return new Strategy({
    client,
    params: {
      redirect_uri: `${config.hostingEnvironment.protocol}://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}/auth/cb`,
      scope: 'openid profile email'
    },
  }, (tokenset, authUserInfo, done) => {
    done(null, { ...tokenset.claims, id_token: tokenset.id_token, id: tokenset.claims.sub, name: tokenset.sub });
  });
};

const hasJwtExpired = (exp) => {
  if (!exp) {
    return true;
  }

  const expires = new Date(Date.UTC(1970, 0, 1) + (exp * 1000)).getTime();
  const now = Date.now();
  return expires < now;
};


const init = async (app) => {
  passport.use('oidc', await getPassportStrategy());
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    if (hasJwtExpired(user.exp)) {
      done(null, null);
    } else {
      done(null, user);
    }
  });
  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/auth', passport.authenticate('oidc'));
  app.get('/auth/cb', (req, res, next) => {
    const defaultLoggedInPath = '/';

    if (req.query.error === 'sessionexpired') {
      return res.redirect(defaultLoggedInPath);
    }
    passport.authenticate('oidc', async (err, user) => {
      let redirectUrl = defaultLoggedInPath;

      if (err) {
        if (err.message.match(/state\smismatch/)) {
          req.session = null;
          return res.redirect(defaultLoggedInPath);
        }
        logger.error(`Error in auth callback - ${err}`);
        return next(err);
      }
      if (!user) {
        return res.redirect('/');
      }

      const userDetails = {
        sub: user.sub,
        email: user.email,
        exp: user.exp,
        id_token: user.id_token,
      };

      const supportClaims = await getUserSupportClaims(userDetails.sub);
      if (!supportClaims || !supportClaims.isSupportUser) {
        if (!req.session.redirectUrl.toLowerCase().endsWith('signout')) {
          return res.redirect('/not-authorised');
        }
      } else {
        Object.assign(userDetails, supportClaims);
      }

      if (req.session.redirectUrl) {
        redirectUrl = req.session.redirectUrl;
        req.session.redirectUrl = null;
      }

      return req.logIn(userDetails, (loginErr) => {
        if (loginErr) {
          logger.error(`Login error in auth callback - ${loginErr}`);
          return next(loginErr);
        }
        if (redirectUrl.endsWith('signout/complete')) redirectUrl = '/';
        return res.redirect(redirectUrl);
      });
    })(req, res, next);
  });
};


module.exports = {
  init,
};
