const logger = require('./../../infrastructure/logger');
const userDevices = require('./../../infrastructure/userDevices');
const { getPageOfUsers } = require('./../../infrastructure/directories');
const organisations = require('./../../infrastructure/organisations');
const { cache: auditCache } = require('./../../infrastructure/audit');
const {v4:uuid} = require('uuid');
const devices = require('./../../infrastructure/devices');
const { asyncMapLimit } = require('./../../infrastructure/utils');
const { flatten, chunk } = require('lodash');

const buildUser = async (user, allDevices, correlationId) => {

  const userDevices = user.devices;

  if (!userDevices || userDevices.length === 0) {
    return null;
  }

  logger.info(`Building user ${user.email} (id:${user.sub}) for userDevice syncing`);

  // Update with orgs
  const orgServiceMapping = await organisations.getUserOrganisations(user.sub, correlationId);

  // Update with last login
  let successfulLoginAudit = null;
  const userAuditDetails = await auditCache.getStatsForUser(user.sub);
  if (userAuditDetails && userAuditDetails.lastLogin) {
    successfulLoginAudit = userAuditDetails.lastLogin
  }

  return userDevices.map((device) => {

    if (allDevices.find((aDevice) => {
      return aDevice.serialNumber === device.serialNumber
    })) {
      allDevices.find((aDevice) => {
        return aDevice.serialNumber === device.serialNumber
      }).isAssigned = true;
    }

    return {
      id: user.sub,
      name: `${user.given_name} ${user.family_name}`,
      email: user.email,
      organisation: orgServiceMapping && orgServiceMapping.length > 0 ? orgServiceMapping[0].organisation : null,
      lastLogin: successfulLoginAudit ? successfulLoginAudit.getTime() : null,
      device: {
        id: device.id,
        serialNumber: device.serialNumber,
        status: device.deactivated ? 'Deactivated' : 'Active'
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
        status: device.deactivated ? 'Deactivated' : 'Unassigned'
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
    const pageOfUsers = await getPageOfUsers(pageNumber, 250, true, false, false, undefined, correlationId);
    if (pageOfUsers.users) {
      const mappedUsers = await asyncMapLimit(pageOfUsers.users, async (user) => {
        return await buildUser(user, allDevices, correlationId);
      });

      const filteredUsers = mappedUsers.filter((user) => {
        return user !== null;
      });

      if (filteredUsers && filteredUsers.length > 0) {
        await userDevices.updateIndex(flatten(filteredUsers), newIndexName);
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
      const unassignedDeviceBatches = chunk(devicesWithoutUsers, 500);
      for (let i = 0; i < unassignedDeviceBatches.length; i += 1) {
        await userDevices.updateIndex(unassignedDeviceBatches[i], newIndexName);
      }
    }
  }

  await userDevices.updateActiveIndex(newIndexName);
  logger.info(`Pointed user index to ${newIndexName}`);

  logger.info('Finished syncing userdevice view');
};


module.exports = syncUserDevicesView;