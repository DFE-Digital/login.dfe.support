const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const csurf = require('csurf');
const morgan = require('morgan');
const logger = require('./infrastructure/logger');
const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('./infrastructure/config');
const helmet = require('helmet');
const sanitization = require('login.dfe.sanitization');
const oidc = require('./infrastructure/oidc');
const moment = require('moment');
const registerRoutes = require('./routes');

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

  Object.assign(app.locals, {
    moment,
    app: {
      title: 'Login.Dfe',
    },
  });

  if (config.hostingEnvironment.env !== 'dev') {
    app.set('trust proxy', 1);
  }
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: config.hostingEnvironment.sessionSecret,
    cookie: {
      httpOnly: true,
      secure: true,
    },
  }));

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(sanitization());

  app.use(morgan('combined', { stream: fs.createWriteStream('./access.log', { flags: 'a' }) }));
  app.use(morgan('dev'));

  app.set('view engine', 'ejs');
  app.set('views', path.resolve(__dirname, 'app'));
  app.use(expressLayouts);
  app.set('layout', 'layouts/layout');

  await oidc.init(app);

  registerRoutes(app, csrf);

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