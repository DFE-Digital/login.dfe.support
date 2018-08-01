const logger = require('./../src/infrastructure/logger');
const audit = require('./../src/infrastructure/audit');
const { syncUsersView } = require('./../src/app/syncViews');

logger.info('Initialising audit');
audit.cache.init().then(() => {
  syncUsersView().then(() => {
    logger.info('Success');
    process.exit();
  }).catch((e) => {
    logger.error(`Error syncing user view - ${e.message}.`);
    process.exit(2);
  });
}).catch((e) => {
  logger.error(`Error initialising audit cache - ${e.message}. Exiting`);
  process.exit(1);
});
