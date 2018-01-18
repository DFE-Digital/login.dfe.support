const logger = require('./../../infrastructure/logger');
const users = require('./../../infrastructure/users');
const directories = require('./../../infrastructure/directories');
const organisations = require('./../../infrastructure/organisations');
const audit = require('./../../infrastructure/audit');
const uuid = require('uuid/v4');

const buildUser = async (user, correlationId) => {
  // Update with orgs
  const orgServiceMapping = await organisations.getUserOrganisations(user.sub, correlationId);

  // Update with last login
  let successfulLoginAudit = null;
  let hasMoreAuditPages = true;
  let pageNumber = 1;
  while (hasMoreAuditPages && !successfulLoginAudit) {
    const pageOfAudit = await  audit.getUserAudit(user.sub, pageNumber);
    successfulLoginAudit = pageOfAudit.audits.find(a => a.type === 'sign-in' && a.subType === 'username-password' && a.success);

    pageNumber++;
    hasMoreAuditPages = pageNumber <= pageOfAudit.numberOfPages;
  }

  return {
    name: `${user.given_name} ${user.family_name}`,
    email: user.email,
    organisation: orgServiceMapping && orgServiceMapping.length > 0 ? orgServiceMapping[0].organisation : null,
    lastLogin: successfulLoginAudit ? new Date(successfulLoginAudit.timestamp).getTime() : null,
    status: {
      description: 'Active'
    }
  }
};

const syncUsersView = async () => {
  const correlationId = uuid();

  logger.info(`Starting to sync users view (correlation id: ${correlationId})`);

  // Create new index
  const newIndexName = await users.createIndex();

  // Get all users from directories
  let hasMorePages = true;
  let pageNumber = 1;
  while (hasMorePages) {
    logger.info(`Syncing page ${pageNumber} of users`);
    const pageOfUsers = await directories.getPageOfUsers(pageNumber, correlationId);
    if (pageOfUsers.users) {
      const mappedUsers = await Promise.all(pageOfUsers.users.map(async (user) => {
        logger.info(`Building user ${user.email} (id:${user.sub}) for syncing`);
        return await buildUser(user, correlationId);
      }));
      await users.updateIndex(mappedUsers, newIndexName);
    }
    pageNumber++;
    hasMorePages = pageNumber <= pageOfUsers.numberOfPages;
  }

  await users.updateActiveIndex(newIndexName);
  logger.info(`Pointed user index to ${newIndexName}`);

  logger.info('Finished syncing users view');
};

module.exports = syncUsersView;