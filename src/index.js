const appInsights = require('applicationinsights');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('cookie-session');
const expressLayouts = require('express-ejs-layouts');
const csurf = require('csurf');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const sanitization = require('login.dfe.sanitization');
const moment = require('moment');
const flash = require('express-flash-2');
const setCorrelationId = require('express-mw-correlation-id');
const { getErrorHandler, ejsErrorPages } = require('login.dfe.express-error-handling');
const registerRoutes = require('./routes');
const oidc = require('./infrastructure/oidc');
const config = require('./infrastructure/config');
const logger = require('./infrastructure/logger');
const configSchema = require('./infrastructure/config/schema');

configSchema.validate();

https.globalAgent.maxSockets = http.globalAgent.maxSockets = config.hostingEnvironment.agentKeepAlive.maxSockets || 50;

if (config.hostingEnvironment.applicationInsights) {
  appInsights.setup(config.hostingEnvironment.applicationInsights).start();
}

const init = async () => {
  const csrf = csurf({
    cookie: {
      secure: true,
      httpOnly: true,
    },
  });

  const app = express();

  if (config.hostingEnvironment.hstsMaxAge) {
    app.use(helmet.hsts(
      {
        maxAge: config.hostingEnvironment.hstsMaxAge,
        preload: true,
      },
    ));
  }

  logger.info('set helmet policy defaults');

  // Setting helmet Content Security Policy
  const scriptSources = ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'localhost', '*.signin.education.gov.uk'];

  app.use(helmet.contentSecurityPolicy({
    browserSniff: false,
    setAllHeaders: false,
    directives: {
      defaultSrc: ["'self'"],
      childSrc: ["'none'"],
      objectSrc: ["'none'"],
      scriptSrc: scriptSources,
      styleSrc: ["'self'", "'unsafe-inline'", 'localhost', '*.signin.education.gov.uk'],
      imgSrc: ["'self'", 'data:', 'blob:', 'localhost', '*.signin.education.gov.uk'],
      fontSrc: ["'self'", 'data:', '*.signin.education.gov.uk'],
      connectSrc: ["'self'"],
      formAction: ["'self'", '*'],
    },
  }));

  logger.info('Set helmet filters');

  app.use(helmet.xssFilter());
  app.use(helmet.frameguard('false'));
  app.use(helmet.ieNoOpen());

  logger.info('helmet setup complete');

  app.use(setCorrelationId('X-Correlation-ID'));

  let assetsUrl = config.assets.url;
  assetsUrl = assetsUrl.endsWith('/') ? assetsUrl.substr(0, assetsUrl.length - 1) : assetsUrl;
  Object.assign(app.locals, {
    moment,
    urls: {
      profile: config.hostingEnvironment.profileUrl,
      assets: assetsUrl,
    },
    app: {
      title: 'DfE Sign-in Support Console',
      environmentBannerMessage: config.hostingEnvironment.environmentBannerMessage,
    },
    gaTrackingId: config.hostingEnvironment.gaTrackingId,
    assets: {
      version: config.assets.version,
    },
  });

  if (config.hostingEnvironment.env !== 'dev') {
    app.set('trust proxy', 1);
  }

  let expiryInMinutes = 30;
  const sessionExpiry = parseInt(config.hostingEnvironment.sessionCookieExpiryInMinutes);
  if (!isNaN(sessionExpiry)) {
    expiryInMinutes = sessionExpiry;
  }
  app.use(session({
    keys: [config.hostingEnvironment.sessionSecret],
    maxAge: expiryInMinutes * 60000, // Expiry in milliseconds
    httpOnly: true,
    secure: true,
  }));
  app.use((req, res, next) => {
    req.session.now = Date.now();
    next();
  });

  app.use(flash());

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(sanitization({
    sanitizer: (key, value) => {
      const fieldToNotSanitize = ['email-subject', 'email-contents', 'criteria', 'email', 'firstName', 'lastName', 'reason'];
      if (fieldToNotSanitize.find((x) => x.toLowerCase() === key.toLowerCase())) {
        return value;
      }
      return sanitization.defaultSanitizer(key, value);
    },
  }));

  app.set('view engine', 'ejs');
  app.set('views', path.resolve(__dirname, 'app'));
  app.use(expressLayouts);
  app.set('layout', 'sharedViews/layout');

  await oidc.init(app);

  app.use('/assets', express.static(path.join(__dirname, 'app/assets')));
  /*
    Addressing issue with latest version of passport dependency packge
    TypeError: req.session.regenerate is not a function
    Reference: https://github.com/jaredhanson/passport/issues/907#issuecomment-1697590189
  */
  app.use((request, response, next) => {
    if (request.session && !request.session.regenerate) {
      request.session.regenerate = (cb) => {
        cb();
      };
    }
    if (request.session && !request.session.save) {
      request.session.save = (cb) => {
        cb();
      };
    }
    next();
  });
  registerRoutes(app, csrf);

  const errorPageRenderer = ejsErrorPages.getErrorPageRenderer({
    help: config.hostingEnvironment.helpUrl,
    assets: assetsUrl,
    assetsVersion: config.assets.version,
  }, config.hostingEnvironment.env === 'dev');
  app.use(getErrorHandler({
    logger,
    errorPageRenderer,
  }));

  if (config.hostingEnvironment.env === 'dev') {
    app.proxy = true;

    const options = {
      key: config.hostingEnvironment.sslKey,
      cert: config.hostingEnvironment.sslCert,
      requestCert: false,
      rejectUnauthorized: false,
    };
    const server = https.createServer(options, app);

    server.listen(config.hostingEnvironment.port, () => {
      logger.info(`Dev server listening on https://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`);
    });
  } else {
    app.listen(process.env.PORT, () => {
      logger.info(`Server listening on http://${config.hostingEnvironment.host}:${config.hostingEnvironment.port}`);
    });
  }

  return app;
};

const app = init().catch(((err) => {
  logger.error(err);
}));

module.exports = app;
