'use strict';

const {
  createLogger, format, transports, addColors,
} = require('winston');

const {
  combine, prettyPrint, errors, simple, colorize,
} = format;

const WinstonSequelizeTransport = require('login.dfe.audit.winston-sequelize-transport');
const appInsights = require('applicationinsights');
const AppInsightsTransport = require('login.dfe.winston-appinsights');
const config = require('../config');

const logLevel = (config && config.loggerSettings && config.loggerSettings.logLevel) ? config.loggerSettings.logLevel : 'info';

const levelsAndColor = {
  levels: {
    audit: 0,
    error: 1,
    warn: 2,
    info: 3,
    verbose: 4,
    debug: 5,
  },
  colors: {
    audit: 'magenta',
    error: 'red',
    warn: 'yellow',
    info: 'blue',
    verbose: 'cyan',
    debug: 'green',
  },
};

addColors(levelsAndColor.colors);

const loggerConfig = {
  levels: levelsAndColor.levels,
  transports: [],
};

// Formatter to hide audit records from other loggers.
const hideAudit = format((info) => ((info.level.toLowerCase() === 'audit') ? false : info));

loggerConfig.transports.push(new transports.Console({
  level: logLevel,
  format: combine(
    hideAudit(),
    colorize({ all: true }),
    simple(),
  ),
}));

const sequelizeTransport = WinstonSequelizeTransport(config);

if (sequelizeTransport) {
  loggerConfig.transports.push(sequelizeTransport);
}

if (config.hostingEnvironment.applicationInsights) {
  appInsights.setup(config.hostingEnvironment.applicationInsights).setAutoCollectConsole(false, false).start();
  loggerConfig.transports.push(new AppInsightsTransport({
    format: combine(hideAudit(), format.json()),
    client: appInsights.defaultClient,
    applicationName: config.loggerSettings.applicationName || 'Support',
    type: 'event',
    treatErrorsAsExceptions: true,
  }));
}

const logger = createLogger({
  format: combine(
    simple(),
    errors({ stack: true }),
    prettyPrint(),
  ),
  transports: loggerConfig.transports,
  levels: loggerConfig.levels,
});

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at:', p, 'reason:', reason);
});

module.exports = logger;
