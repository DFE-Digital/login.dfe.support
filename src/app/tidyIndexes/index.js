const logger = require('./../../infrastructure/logger');
const users = require('./../../infrastructure/users');

const tidyIndexes = async () => {
  logger.info('Starting to tidy indexes');

  // Users
  logger.info('Deleting unused user indexes');
  await users.deleteUnusedIndexes();

  logger.info('Finished tidying indexes');
};

module.exports = {
  tidyIndexes,
};
