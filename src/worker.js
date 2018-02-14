const schedule = require('node-schedule');
const logger = require('./infrastructure/logger');
const config = require('./infrastructure/config');

const { syncUsersView, syncUserDevicesView } = require('./app/syncViews');
const { tidyIndexes } = require('./app/tidyIndexes');

const userSchedule = schedule.scheduleJob(config.schedules.users, syncUsersView);
logger.info(`first invocation of user schedule will be ${userSchedule.nextInvocation()}`);

// const userDeviceSchedule = schedule.scheduleJob(config.schedules.userDevices, syncUserDevicesView);
// logger.info(`first invocation of userDevice schedule will be ${userDeviceSchedule.nextInvocation()}`);

// const indexTidySchedule = schedule.scheduleJob(config.schedules.indexTidy, tidyIndexes);
// logger.info(`first invocation of index tidy schedule will be ${indexTidySchedule.nextInvocation()}`);