const logger = require('./../../infrastructure/logger');
const users = require('./../../infrastructure/users');
const directories = require('./../../infrastructure/directories');
const organisations = require('./../../infrastructure/organisations');
const { cache: auditCache } = require('./../../infrastructure/audit');
const uuid = require('uuid/v4');
const { mapUserStatus } = require('./../../infrastructure/utils');
const flatten = require('lodash/flatten');

const buildUser = async (user, correlationId) => {
  // Get organisation & service details
  const orgServiceMapping = await organisations.getUserOrganisations(user.sub, correlationId);
  let organisation = null;
  let organisationCategories = [];
  let services = [];
  if (orgServiceMapping && orgServiceMapping.length > 0) {
    const temp = flatten(orgServiceMapping.map((org) => {
      return org.services.map(svc => ({
        id: svc.id,
        organisation: org.organisation,
        requestDate: svc.requestDate,
      }));
    })).sort((x, y) => {
      if (x.requestDate < y.requestDate) {
        return -1;
      }
      if (x.requestDate > y.requestDate) {
        return 1;
      }
      return 0;
    });
    if (temp && temp.length > 0) {
      organisation = temp[0].organisation;
      services = temp.map(s => s.id);
    } else {
      organisation = orgServiceMapping[0].organisation;
    }
    organisationCategories = orgServiceMapping.map((org) => org.organisation.category ? org.organisation.category.id : undefined).filter(x => x !== undefined);
  }

  // Get audit details
  let successfulLogins;
  let statusLastChangedOn;
  let lastLogin;
  const userAuditDetails = await auditCache.getStatsForUser(user.sub);
  if (userAuditDetails) {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    lastLogin = userAuditDetails.lastLogin ? userAuditDetails.lastLogin.getTime() : null;
    statusLastChangedOn = userAuditDetails.lastStatusChange ? userAuditDetails.lastStatusChange.getTime() : null;
    successfulLogins = userAuditDetails.loginsInPast12Months.filter(x => x.timestamp.getTime() >= twelveMonthsAgo.getTime())
  }

  // Check for change of email
  let pendingEmail;
  const changeEmailCode = await directories.getChangeEmailCode(user.sub, correlationId);
  if (changeEmailCode) {
    pendingEmail = changeEmailCode.email;
  }

  // Consolidate
  return {
    id: user.sub,
    name: `${user.given_name} ${user.family_name}`,
    firstName: user.given_name,
    lastName: user.family_name,
    email: user.email,
    organisation: organisation ? {
      id: organisation.id,
      name: organisation.name,
    } : null,
    organisationCategories,
    services,
    lastLogin: lastLogin,
    successfulLoginsInPast12Months: successfulLogins ? successfulLogins.length : 0,
    status: mapUserStatus(user.status, statusLastChangedOn),
    pendingEmail,
  };
};

const loadUsers = async (newIndexName, correlationId) => {
  let hasMorePages = true;
  let pageNumber = 1;
  while (hasMorePages) {
    logger.info(`Syncing page ${pageNumber} of users`);
    const pageOfUsers = await directories.getPageOfUsers(pageNumber, correlationId);
    if (pageOfUsers.users && pageOfUsers.users.length > 0) {
      const mappedUsers = await Promise.all(pageOfUsers.users.map(async (user) => {
        logger.info(`Building user ${user.email} (id:${user.sub}) for syncing`);
        return await buildUser(user, correlationId);
      }));
      await users.updateIndex(mappedUsers, newIndexName);
    }
    pageNumber++;
    hasMorePages = pageNumber <= pageOfUsers.numberOfPages;
  }
};

const loadInvitations = async (newIndexName, correlationId) => {
  let hasMorePages = true;
  let pageNumber = 1;
  while (hasMorePages) {
    logger.info(`Syncing page ${pageNumber} of invitations`);
    const pageOfInvitations = await directories.getPageOfInvitations(pageNumber, correlationId);
    if (pageOfInvitations.invitations && pageOfInvitations.invitations.length > 0) {
      const mappedInvitations = (await Promise.all(pageOfInvitations.invitations.map(async (invitation) => {
        logger.info(`Building invitation ${invitation.email} (id:${invitation.id}) for syncing`);
        if (invitation.isCompleted) {
          return null;
        }
        const orgServiceMapping = await organisations.getInvitationOrganisations(invitation.id, correlationId);
        return {
          id: `inv-${invitation.id}`,
          name: `${invitation.firstName} ${invitation.lastName}`,
          email: invitation.email,
          organisation: orgServiceMapping && orgServiceMapping.length > 0 ? orgServiceMapping[0].organisation : null,
          lastLogin: null,
          status: invitation.deactivated ? mapUserStatus(-2) : mapUserStatus(-1),
        };
      }))).filter(x => x !== null);
      await users.updateIndex(mappedInvitations, newIndexName);
    }
    pageNumber++;
    hasMorePages = pageNumber <= pageOfInvitations.numberOfPages;
  }
};

const syncUsersView = async () => {
  const correlationId = uuid();

  logger.info(`Starting to sync users view (correlation id: ${correlationId})`);

  // Create new index
  const newIndexName = await users.createIndex();

  // Get all users from directories
  await loadUsers(newIndexName, correlationId);
  await loadInvitations(newIndexName, correlationId);

  // Re-point current index
  await users.updateActiveIndex(newIndexName);
  logger.info(`Pointed user index to ${newIndexName}`);

  logger.info('Finished syncing users view');
};

module.exports = syncUsersView;