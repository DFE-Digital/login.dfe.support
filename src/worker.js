const schedule = require('node-schedule');
const logger = require('./infrastructure/logger');
const config = require('./infrastructure/config');

const { syncUsersView } = require('./app/syncViews');
const { tidyIndexes } = require('./app/tidyIndexes');

const userSchedule = schedule.scheduleJob(config.schedules.users, syncUsersView);
logger.info(`first invocation of user schedule will be ${userSchedule.nextInvocation()}`);

const indexTidySchedule = schedule.scheduleJob(config.schedules.indexTidy, tidyIndexes);
logger.info(`first invocation of index tidy schedule will be ${indexTidySchedule.nextInvocation()}`);