const schedule = require('node-schedule');
const logger = require('./infrastructure/logger');
const config = require('./infrastructure/config');
const http = require('http');
const https = require('https');
const KeepAliveAgent = require('agentkeepalive');

const audit = require('./infrastructure/audit');
const { syncUsersView, syncUserDevicesView, syncAuditCache, syncAccessRequestsView } = require('./app/syncViews');
const { tidyIndexes } = require('./app/tidyIndexes');

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

  const userSchedule = schedule.scheduleJob(config.schedules.users, syncUsersView);
  logger.info(`first invocation of user schedule will be ${userSchedule.nextInvocation()}`);

  const userDeviceSchedule = schedule.scheduleJob(config.schedules.userDevices, syncUserDevicesView);
  logger.info(`first invocation of userDevice schedule will be ${userDeviceSchedule.nextInvocation()}`);

  const accessRequestSchedule = schedule.scheduleJob(config.schedules.accessRequests, syncAccessRequestsView);
  logger.info(`first invocation of access requests schedule will be ${accessRequestSchedule.nextInvocation()}`);

  const indexTidySchedule = schedule.scheduleJob(config.schedules.indexTidy, tidyIndexes);
  logger.info(`first invocation of index tidy schedule will be ${indexTidySchedule.nextInvocation()}`);
}).catch((e) => {
  logger.error(`Error initialising audit cache - ${e.message}. Exiting`);
  process.exit(1);
});
