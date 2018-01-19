const schedule = require('node-schedule');
const logger = require('./infrastructure/logger');
const config = require('./infrastructure/config');

const { syncUsersView } = require('./app/syncViews');

const userSchedule = schedule.scheduleJob(config.schedules.users, syncUsersView);
logger.info(`first invocation of user schedule will be ${userSchedule.nextInvocation()}`);