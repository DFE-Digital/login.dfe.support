const logger = require('./infrastructure/logger');
const config = require('./infrastructure/config');
const http = require('http');
const https = require('https');
const express = require('express');
const healthCheck = require('login.dfe.healthcheck');

const audit = require('./infrastructure/audit');
const { startSchedules } = require('./schedules');
const configSchema = require('./infrastructure/config/schema');

configSchema.validate();

https.globalAgent.maxSockets = http.globalAgent.maxSockets = config.hostingEnvironment.agentKeepAlive.maxSockets || 50;


logger.info('Initialising audit');
audit.cache.init().then(() => {
  startSchedules();



  const port = process.env.PORT || 3000;
  const app = express();
  app.use('/healthcheck', healthCheck({ config }));
  app.get('/', (req, res) => {
    res.send();
  });
  app.listen(port, () => {
    logger.info(`Server listening on http://localhost:${port}`);
  });

}).catch((e) => {
  logger.error(`Error initialising audit cache - ${e.message}. Exiting`);
  process.exit(1);
});
