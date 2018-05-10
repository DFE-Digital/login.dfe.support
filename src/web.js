const logger = require('./infrastructure/logger');
const appInsights = require('applicationinsights');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('cookie-session');
const expressLayouts = require('express-ejs-layouts');
const csurf = require('csurf');
const morgan = require('morgan');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('./infrastructure/config');
const helmet = require('helmet');
const sanitization = require('login.dfe.sanitization');
const oidc = require('./infrastructure/oidc');
const moment = require('moment');
const flash = require('express-flash-2');
const setCorrelationId = require('express-mw-correlation-id');
const registerRoutes = require('./routes');
const { getErrorHandler, ejsErrorPages } = require('login.dfe.express-error-handling');
const KeepAliveAgent = require('agentkeepalive');

if (config.hostingEnvironment.applicationInsights) {
  appInsights.setup(config.hostingEnvironment.applicationInsights).start();
}
http.GlobalAgent = new KeepAliveAgent({
  maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
  maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
  timeout: config.hostingEnvironment.agentKeepAlive.timeout,
  keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
});
https.GlobalAgent = new KeepAliveAgent({
  maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
  maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
  timeout: config.hostingEnvironment.agentKeepAlive.timeout,
  keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
});

const init = async () => {
  const csrf = csurf({
    cookie: {
      secure: true,
      httpOnly: true,
    },
  });

  const app = express();
  app.use(helmet({
    noCache: true,
    frameguard: {
      action: 'deny',
    },
  }));
  app.use(setCorrelationId(true));

  Object.assign(app.locals, {
    moment,
    urls: {
        profile: config.hostingEnvironment.profileUrl,
    },
    app: {
      title: 'DfE Sign-in Support Console',
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
  app.use(sanitization());

  app.use(morgan('combined', { stream: fs.createWriteStream('./access.log', { flags: 'a' }) }));
  app.use(morgan('dev'));

  app.set('view engine', 'ejs');
  app.set('views', path.resolve(__dirname, 'app'));
  app.use(expressLayouts);
  app.set('layout', 'sharedViews/layout');

  await oidc.init(app);

  app.use('/assets', express.static(path.join(__dirname, 'app/assets')));
  registerRoutes(app, csrf);

  const errorPageRenderer = ejsErrorPages.getErrorPageRenderer({
    help: config.hostingEnvironment.helpUrl,
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
      logger.info(`Dev server listening on https://${config.hostingEnvironment.host}:${config.hostingEnvironment.port} with config:\n${JSON.stringify(config)}`);
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