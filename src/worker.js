const schedule = require('node-schedule');
const logger = require('./infrastructure/logger');
const config = require('./infrastructure/config');
const http = require('http');
const https = require('https');
const KeepAliveAgent = require('agentkeepalive');
const express = require('express');
const healthCheck = require('login.dfe.healthcheck');

const audit = require('./infrastructure/audit');
const { syncFullUsersView, syncDiffUsersView, syncUserDevicesView, syncAuditCache, syncAccessRequestsView } = require('./app/syncViews');
const { tidyIndexes } = require('./app/tidyIndexes');
const configSchema = require('./infrastructure/config/schema');

configSchema.validate();

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

logger.info('Initialising audit');
audit.cache.init().then(() => {
  const auditCacheSchedule = schedule.scheduleJob(config.schedules.auditCache, syncAuditCache);
  logger.info(`first invocation of audit cache schedule will be ${auditCacheSchedule.nextInvocation()}`);

  const userFullSchedule = schedule.scheduleJob(config.schedules.usersFull, syncFullUsersView);
  logger.info(`first invocation of full user schedule will be ${userFullSchedule.nextInvocation()}`);

  const userDiffSchedule = schedule.scheduleJob(config.schedules.usersDiff, syncDiffUsersView);
  logger.info(`first invocation of diff user schedule will be ${userDiffSchedule.nextInvocation()}`);

  const userDeviceSchedule = schedule.scheduleJob(config.schedules.userDevices, syncUserDevicesView);
  logger.info(`first invocation of userDevice schedule will be ${userDeviceSchedule.nextInvocation()}`);

  const accessRequestSchedule = schedule.scheduleJob(config.schedules.accessRequests, syncAccessRequestsView);
  logger.info(`first invocation of access requests schedule will be ${accessRequestSchedule.nextInvocation()}`);

  const indexTidySchedule = schedule.scheduleJob(config.schedules.indexTidy, tidyIndexes);
  logger.info(`first invocation of index tidy schedule will be ${indexTidySchedule.nextInvocation()}`);



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
