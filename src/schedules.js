const schedule = require('node-schedule');
const logger = require('./infrastructure/logger');
const config = require('./infrastructure/config');
const uuid = require('uuid/v4');

const { syncFullUsersView, syncDiffUsersView, syncUserDevicesView, syncAuditCache } = require('./app/syncViews');
const { tidyIndexes } = require('./app/tidyIndexes');

const scheduleTask = (name, cronSpec, action) => {
  const job = schedule.scheduleJob(cronSpec, async () => {
    const correlationId = `${name.replace(/[\s,-]/g, '')}-${uuid()}`;
    try {
      logger.info(`starting job ${name}`, { correlationId });

      const start = Date.now();
      await action(correlationId);
      const durationInMilliseconds = Date.now() - start;

      logger.info(`successfully completed job ${name} in ${durationInMilliseconds / 1000}s`, { correlationId });
    } catch (e) {
      logger.error(`error running job ${name}: ${e.stack}`, { correlationId });
    } finally {
      logger.info(`next invocation of job ${name} will be ${job.nextInvocation()}`);
    }
  });
  logger.info(`first invocation of job ${name} will be ${job.nextInvocation()} (spec: ${cronSpec})`);
};

const startSchedules = () => {
  scheduleTask('audit cache', config.schedules.auditCache, syncAuditCache);
  scheduleTask('full user', config.schedules.usersFull, syncFullUsersView);
  scheduleTask('diff user', config.schedules.usersDiff, syncDiffUsersView);
  scheduleTask('user devices', config.schedules.userDevices, syncUserDevicesView);
  scheduleTask('index tidy', config.schedules.indexTidy, tidyIndexes);
};

module.exports = {
  startSchedules,
};