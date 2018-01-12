const schedule = require('node-schedule');
const logger = require('./infrastructure/logger');
const config = require('./infrastructure/config');

const userSchedule = schedule.scheduleJob(config.schedules.users, () => {
  logger.info('update users index');
});
logger.info(`first invocation of user schedule will be ${userSchedule.nextInvocation()}`);