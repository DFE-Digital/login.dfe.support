const logger = require('./../../infrastructure/logger');
const users = require('./../../infrastructure/users');
const directories = require('./../../infrastructure/directories');
const organisations = require('./../../infrastructure/organisations');
const { cache: auditCache } = require('./../../infrastructure/audit');
const uuid = require('uuid/v4');
const { mapUserStatus } = require('./../../infrastructure/utils');

const getOrgServiceMappingDetails = async (orgServiceMapping) => {
  let organisation = null;
  let organisationCategories = [];
  let services = [];
  if (orgServiceMapping && orgServiceMapping.length > 0) {
    const ordered = orgServiceMapping.sort((x, y) => {
      if (x.requestDate < y.requestDate) {
        return -1;
      }
      if (x.requestDate > y.requestDate) {
        return 1;
      }
      return 0;
    });

    organisation = ordered[0].organisation;
    organisationCategories = orgServiceMapping.map((svcMap) => svcMap.organisation.category ? svcMap.organisation.category.id : undefined).filter(x => x !== undefined);
    services = orgServiceMapping.map((svcMap) => svcMap.id);
  }
  return {
    organisation,
    organisationCategories,
    services,
  };
};

const getAllUserServiceMappings = async (correlationId) => {
  let hasMorePages = true;
  let pageNumber = 1;
  const userServiceMappings = [];
  while (hasMorePages) {
    logger.info(`Reading page ${pageNumber} of user service mappings (correlationId: ${correlationId})`, { correlationId });
    const page = await organisations.listUserServices(pageNumber, 250, correlationId);
    if (page.services && page.services.length > 0) {
      userServiceMappings.push(...page.services);
    }
    pageNumber++;
    hasMorePages = pageNumber < page.totalNumberOfPages;
  }
  return userServiceMappings;
};
const getAllUsers = async (correlationId) => {
  let hasMorePages = true;
  let pageNumber = 1;
  const users = [];
  while (hasMorePages) {
    logger.info(`Reading page ${pageNumber} of users (correlationId: ${correlationId})`, { correlationId });
    const page = await directories.getPageOfUsers(pageNumber, 250, false, true, correlationId);
    if (page.users && page.users.length > 0) {
      users.push(...page.users);
    }
    pageNumber++;
    hasMorePages = pageNumber < page.numberOfPages;
  }
  return users;
};
const getUserAuditStats = async (userId) => {
  const userAuditDetails = await auditCache.getStatsForUser(userId);
  if (userAuditDetails) {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    return {
      lastLogin: userAuditDetails.lastLogin ? userAuditDetails.lastLogin.getTime() : null,
      statusLastChangedOn: userAuditDetails.lastStatusChange ? userAuditDetails.lastStatusChange.getTime() : null,
      successfulLogins: userAuditDetails.loginsInPast12Months.filter(x => x.timestamp.getTime() >= twelveMonthsAgo.getTime()),
    };
  }

  return {
    lastLogin: null,
    statusLastChangedOn: null,
    successfulLogins: [],
  };
};
const buildAllUsers = async (correlationId) => {
  const usersPromise = getAllUsers(correlationId);
  const servicesPromise = getAllUserServiceMappings(correlationId);

  const users = await usersPromise;
  const serviceMappings = await servicesPromise;
  const usersForIndex = [];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userServices = serviceMappings.filter(x => x.userId === user.sub);
    const { lastLogin, statusLastChangedOn, successfulLogins } = await getUserAuditStats(user.sub);
    const { organisation, organisationCategories, services } = getOrgServiceMappingDetails(userServices);

    // Check for change of email
    let pendingEmail;
    const changeEmailCode = user.codes.find(x => x.type.toLowerCase() === 'changeemail');
    if (changeEmailCode) {
      pendingEmail = changeEmailCode.email;
    }

    usersForIndex.push({
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
      successfulLoginsInPast12Months: successfulLogins.length,
      status: mapUserStatus(user.status, statusLastChangedOn),
      pendingEmail,
    })
  }
  return usersForIndex;
};

const getAllInvitationServices = async (correlationId) => {
  let hasMorePages = true;
  let pageNumber = 1;
  const invitationServiceMappings = [];
  while (hasMorePages) {
    logger.info(`Reading page ${pageNumber} of invitation service mappings (correlationId: ${correlationId})`, { correlationId });
    const page = await organisations.listInvitationServices(pageNumber, 250, correlationId);
    if (page.services && page.services.length > 0) {
      invitationServiceMappings.push(...page.services);
    }
    pageNumber++;
    hasMorePages = pageNumber < page.totalNumberOfPages;
  }
  return invitationServiceMappings;
};
const getAllInvitations = async (correlationId) => {
  let hasMorePages = true;
  let pageNumber = 1;
  const invitations = [];
  while (hasMorePages) {
    logger.info(`Reading page ${pageNumber} of invitations (correlationId: ${correlationId})`, { correlationId });
    const page = await directories.getPageOfInvitations(pageNumber, 250, correlationId);
    if (page.invitations && page.invitations.length > 0) {
      invitations.push(...page.invitations);
    }
    pageNumber++;
    hasMorePages = pageNumber < page.numberOfPages;
  }
  return invitations;
};
const buildAllInvitations = async (correlationId) => {
  const invitationsPromise = getAllInvitations(correlationId);
  const servicesPromise = getAllInvitationServices(correlationId);

  const invitations = await invitationsPromise;
  const serviceMappings = await servicesPromise;
  const invitationsForIndex = [];
  for (let i = 0; i < invitations.length; i++) {
    const invitation = invitations[i];
    const invitationServices = serviceMappings.filter(x => x.invitationId === invitation.id);
    const { organisation, organisationCategories, services } = getOrgServiceMappingDetails(invitationServices);

    invitationsForIndex.push({
      id: `inv-${invitation.id}`,
      name: `${invitation.firstName} ${invitation.lastName}`,
      email: invitation.email,
      organisation: organisation ? {
        id: organisation.id,
        name: organisation.name,
      } : null,
      organisationCategories,
      services,
      lastLogin: null,
      status: invitation.deactivated ? mapUserStatus(-2) : mapUserStatus(-1),
    })
  }

  return [];
};


const populateIndex = async (newIndexName, correlationId) => {
  const batchSize = 50;
  const usersPromise = buildAllUsers(correlationId);
  const invitationsPromise = buildAllInvitations(correlationId);

  const indexUsers = await usersPromise;
  for (let i = 0; i < indexUsers.length; i += batchSize) {
    const batch = indexUsers.slice(i, i + batchSize);
    logger.info(`Loading users batch ${i}-${i + batchSize} of ${indexUsers.length} into ${newIndexName} (correlationId: ${correlationId}`, { correlationId });
    await users.updateIndex(batch, newIndexName);
  }

  const indexInvitations = await invitationsPromise;
  for (let i = 0; i < indexInvitations.length; i += batchSize) {
    const batch = indexInvitations.slice(i, i + batchSize);
    logger.info(`Loading invitations batch ${i}-${i + batchSize} of ${indexInvitations.length} into ${newIndexName} (correlationId: ${correlationId}`, { correlationId });
    await users.updateIndex(batch, newIndexName);
  }
};

const syncUsersView = async () => {
  const correlationId = uuid();
  const start = Date.now();

  logger.info(`Starting to sync users view (correlation id: ${correlationId})`, { correlationId });

  // Create new index
  const newIndexName = await users.createIndex();
  logger.info(`Created new user index ${newIndexName} (correlation id: ${correlationId})`);

  await populateIndex(newIndexName, correlationId);

  // Re-point current index
  await users.updateActiveIndex(newIndexName);
  logger.info(`Pointed user index to ${newIndexName} (correlation id: ${correlationId})`, { correlationId });

  const duration = Math.round((Date.now() - start) / 100) / 10;
  logger.info(`Finished syncing users view in ${duration}sec (correlation id: ${correlationId})`, { correlationId });
};

module.exports = syncUsersView;