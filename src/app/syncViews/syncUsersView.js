const logger = require('./../../infrastructure/logger');

const syncUsersView = async () => {
  logger.info('Starting to sync users view');

  logger.info('Finished syncing users view');
};

module.exports = syncUsersView;