const logger = require('./../../infrastructure/logger');
const userDevices = require('./../../infrastructure/userDevices');
const { getPageOfUsers, getUserDevices } = require('./../../infrastructure/directories');
const organisations = require('./../../infrastructure/organisations');
const audit = require('./../../infrastructure/audit');
const uuid = require('uuid/v4');
const devices = require('./../../infrastructure/devices');

const buildUser = async (user, allDevices, correlationId) => {

  const userDevices = await getUserDevices(user.sub, correlationId);

  if (!userDevices || userDevices.length === 0) {
    return null;
  }

  logger.info(`Building user ${user.email} (id:${user.sub}) for userDevice syncing`);

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

  return userDevices.map((device) => {

    allDevices.find((aDevice) => {
      return aDevice.serialNumber === device.serialNumber
    }).isAssigned = true;

    return {
      id: user.sub,
      name: `${user.given_name} ${user.family_name}`,
      email: user.email,
      organisation: orgServiceMapping && orgServiceMapping.length > 0 ? orgServiceMapping[0].organisation : null,
      lastLogin: successfulLoginAudit ? new Date(successfulLoginAudit.timestamp).getTime() : null,
      device: {
        id: device.id,
        serialNumber: device.serialNumber,
        status: 'Active'
      }
    };
  });
};

const buildDevicesWithoutUser = (devices) => {
  return devices.map((device) => {
    return {
      id: uuid(),
      name: undefined,
      email: undefined,
      organisation: undefined,
      lastLogin: undefined,
      device: {
        id: device.id,
        serialNumber: device.serialNumber,
        status: 'Unassigned'
      }
    }
  });
};

const syncUserDevicesView = async () => {
  const correlationId = uuid();

  logger.info(`Starting to sync user devices view (correlation id: ${correlationId})`);

  // Create new index
  const newIndexName = await userDevices.createIndex();

  const allDevices = await devices.getDevices(correlationId);

  // Get all users from directories
  let hasMorePages = true;
  let pageNumber = 1;
  while (hasMorePages) {
    logger.info(`Syncing page ${pageNumber} of userDevices`);
    const pageOfUsers = await getPageOfUsers(pageNumber, correlationId);
    if (pageOfUsers.users) {
      const mappedUsers = await Promise.all(pageOfUsers.users.map(async (user) => {
        return await buildUser(user, allDevices, correlationId);
      }));

      const filteredUsers = mappedUsers.filter((user) => {
        return user !== null;
      });

      if (filteredUsers && filteredUsers.length > 0) {
        await userDevices.updateIndex(...filteredUsers, newIndexName);
      }
    }
    pageNumber++;
    hasMorePages = pageNumber <= pageOfUsers.numberOfPages;
  }

  if (allDevices && allDevices.length > 0) {
    const devicesWithoutUsers = buildDevicesWithoutUser(allDevices.filter((device) => {
      return device.isAssigned === undefined;
    }));

    if (devicesWithoutUsers && devicesWithoutUsers.length > 0) {
      await userDevices.updateIndex(devicesWithoutUsers, newIndexName);
    }
  }

  await userDevices.updateActiveIndex(newIndexName);
  logger.info(`Pointed user index to ${newIndexName}`);

  logger.info('Finished syncing users view');
};


module.exports = syncUserDevicesView;