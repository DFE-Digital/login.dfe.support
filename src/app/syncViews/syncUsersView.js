const logger = require('./../../infrastructure/logger');
const users = require('./../../infrastructure/users');
const directories = require('./../../infrastructure/directories');
const organisations = require('./../../infrastructure/organisations');
const { cache: auditCache } = require('./../../infrastructure/audit');
const uuid = require('uuid/v4');
const { mapUserStatus } = require('./../../infrastructure/utils');

const getOrgServiceMappingDetails = (orgServiceMapping) => {
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
    hasMorePages = pageNumber < page.totalNumberOfPages;
    pageNumber++;
  }
  return userServiceMappings;
};
const getAllUsers = async (changedAfter, correlationId) => {
  let hasMorePages = true;
  let pageNumber = 1;
  let numberOfPages = 'unknown';
  const users = [];
  while (hasMorePages) {
    try {
      logger.info(`Reading page ${pageNumber} of ${numberOfPages} of users (correlationId: ${correlationId})`, { correlationId });
      const page = await directories.getPageOfUsers(pageNumber, 250, false, true, changedAfter, correlationId);
      if (page.users && page.users.length > 0) {
        users.push(...page.users);
      }
      numberOfPages = page.numberOfPages.toString();
      hasMorePages = pageNumber < page.numberOfPages;
      pageNumber++;
    } catch (e) {
      throw new Error(`Error getting page ${pageNumber} of users (correlationId: ${correlationId}, changedAfter: ${changedAfter}) - ${e.message}`);
    }
  }
  logger.info(`Finished reading all users. (found: ${users.length},correlationId: ${correlationId})`);
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
const buildUsers = async (users, serviceMappings) => {
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
const buildAllUsers = async (correlationId) => {
  const usersPromise = getAllUsers(undefined, correlationId);
  const servicesPromise = getAllUserServiceMappings(correlationId);

  const users = await usersPromise;
  const serviceMappings = await servicesPromise;
  return buildUsers(users, serviceMappings);
};
const buildUsersThatHaveChanged = async (correlationId) => {
  const changedAfter = await users.getDateOfLastIndexUpdate();
  const updatedUsers = await getAllUsers(changedAfter, correlationId);
  const userServices = [];

  for (let i = 0; i < updatedUsers.length; i++) {
    const serviceMapping = await organisations.listUserServices(updatedUsers[i].sub, correlationId);
    if (serviceMapping && serviceMapping.length > 0) {
      userServices.push(...serviceMapping);
    }
  }

  return buildUsers(updatedUsers, userServices);
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
    hasMorePages = pageNumber < page.totalNumberOfPages;
    pageNumber++;
  }
  return invitationServiceMappings;
};
const getAllInvitations = async (changedAfter, correlationId) => {
  let hasMorePages = true;
  let pageNumber = 1;
  let numberOfPages = 'unknown';
  const invitations = [];
  while (hasMorePages) {
    try {
      logger.info(`Reading page ${pageNumber} of ${numberOfPages} of invitations (correlationId: ${correlationId})`, { correlationId });
      const page = await directories.getPageOfInvitations(pageNumber, 250, changedAfter, correlationId);
      if (page.invitations && page.invitations.length > 0) {
        invitations.push(...page.invitations);
      }
      numberOfPages = page.numberOfPages.toString();
      hasMorePages = pageNumber < page.numberOfPages;
      pageNumber++;
    } catch (e) {
      throw new Error(`Error getting page ${pageNumber} of invitations (correlationId: ${correlationId}, changedAfter: ${changedAfter}) - ${e.message}`);
    }
  }
  logger.info(`Finished reading all invitations. (found: ${invitations.length},correlationId: ${correlationId})`);
  return invitations;
};
const buildInvitations = (invitations, serviceMappings) => {
  const invitationsForIndex = [];
  for (let i = 0; i < invitations.length; i++) {
    const invitation = invitations[i];
    const invitationServices = serviceMappings.filter(x => x.invitationId === invitation.id);
    const { organisation, organisationCategories, services } = getOrgServiceMappingDetails(invitationServices);

    invitationsForIndex.push({
      id: `inv-${invitation.id}`,
      name: `${invitation.firstName} ${invitation.lastName}`,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
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

  return invitationsForIndex;
};
const buildAllInvitations = async (correlationId) => {
  const invitationsPromise = getAllInvitations(undefined, correlationId);
  const servicesPromise = getAllInvitationServices(correlationId);

  const invitations = await invitationsPromise;
  const serviceMappings = await servicesPromise;
  return buildInvitations(invitations, serviceMappings);
};
const buildInvitationsThatHaveChanged = async (correlationId) => {
  const changedAfter = await users.getDateOfLastIndexUpdate();
  const updatedInvitations = await getAllInvitations(changedAfter, correlationId);
  const invitationServices = [];

  for (let i = 0; i < updatedInvitations.length; i++) {
    const serviceMapping = await organisations.getInvitationOrganisations(updatedInvitations[i].id, correlationId);
    if (serviceMapping && serviceMapping.length > 0) {
      invitationServices.push(...serviceMapping);
    }
  }

  return buildInvitations(updatedInvitations, invitationServices);
};

const populateIndex = async (indexName, userLoader, invitationLoader, correlationId) => {
  const batchSize = 50;
  const usersPromise = userLoader(correlationId);
  const invitationsPromise = invitationLoader(correlationId);

  const indexUsers = await usersPromise;
  for (let i = 0; i < indexUsers.length; i += batchSize) {
    const batch = indexUsers.slice(i, i + batchSize);
    logger.info(`Loading users batch ${i}-${i + batchSize} of ${indexUsers.length} into ${indexName} (correlationId: ${correlationId}`, { correlationId });
    await users.updateIndex(batch, indexName);
  }

  const indexInvitations = await invitationsPromise;
  for (let i = 0; i < indexInvitations.length; i += batchSize) {
    const batch = indexInvitations.slice(i, i + batchSize);
    logger.info(`Loading invitations batch ${i}-${i + batchSize} of ${indexInvitations.length} into ${indexName} (correlationId: ${correlationId}`, { correlationId });
    await users.updateIndex(batch, indexName);
  }
};

const syncFullUsersView = async () => {
  const correlationId = `FullUserIndex-${uuid()}`;
  const start = Date.now();

  logger.info(`Starting to sync full users view (correlation id: ${correlationId})`, { correlationId });

  // Create new index
  const newIndexName = await users.createIndex();
  logger.info(`Created new user index ${newIndexName} (correlation id: ${correlationId})`);

  await populateIndex(newIndexName, buildAllUsers, buildAllInvitations, correlationId);

  // Re-point current index
  await users.updateActiveIndex(newIndexName);
  logger.info(`Pointed user index to ${newIndexName} (correlation id: ${correlationId})`, { correlationId });

  const duration = Math.round((Date.now() - start) / 100) / 10;
  logger.info(`Finished syncing full users view in ${duration}sec (correlation id: ${correlationId})`, { correlationId });
};
const syncDiffUsersView = async () => {
  const correlationId = `DiffUserIndex-${uuid()}`;
  const start = Date.now();

  logger.info(`Starting to sync diff users view (correlation id: ${correlationId})`, { correlationId });

  // Create new index
  const existingIndexName = await users.getExistingIndex();
  logger.info(`Updating user index ${existingIndexName} (correlation id: ${correlationId})`);

  const changesUpTo = new Date();
  await populateIndex(existingIndexName, buildUsersThatHaveChanged, buildInvitationsThatHaveChanged, correlationId);

  await users.setDateOfLastIndexUpdate(changesUpTo);

  const duration = Math.round((Date.now() - start) / 100) / 10;
  logger.info(`Finished syncing diff users view in ${duration}sec (correlation id: ${correlationId})`, { correlationId });
};

module.exports = {
  syncFullUsersView,
  syncDiffUsersView,
};