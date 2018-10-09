const patterns = require('./patterns');
const loggerSettings = require('./loggerSettings');
const agentKeepAlive = require('./agentKeepAlive');
const hostingEnvironment = require('./hostingEnvironment');
const apiClient = require('./apiClient');
const sequelizeConnection = require('./sequelizeConnection');

const validateConfigAgainstSchema = (config, schema, logger) => {
  const strict = !config.hostingEnvironment || config.hostingEnvironment.env !== 'dev';
  const errorLogger = strict ? logger.error : logger.warn;

  const context = schema.newContext();
  context.validate(config);
  if (!context.isValid()) {
    const errors = context.validationErrors();
    errors.forEach((error) => {
      errorLogger(JSON.stringify(error));
    });
    if (strict) {
      process.exit(1);
    }
  }
};

module.exports = {
  validateConfigAgainstSchema,
  schemas: {
    loggerSettings,
    agentKeepAlive,
    hostingEnvironment,
    apiClient,
    sequelizeConnection,
  },
  patterns,
};