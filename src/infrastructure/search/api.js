const jwtStrategy = require('login.dfe.jwt-strategies');
const config = require('./../config');
const { mapUserStatus } = require('./../../infrastructure/utils');
const { fetchApi } = require('login.dfe.async-retry');

const callApi = async (endpoint, method, body, correlationId) => {
  const token = await jwtStrategy(config.search.service).getBearerToken();

  try {
    return await fetchApi(`${config.search.service.url}${endpoint}`,{
      method: method,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: body
    });
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404 || e.statusCode === 400 || e.statusCode === 403) {
      return undefined;
    }
    throw e;
  }
};

const mapSearchUserToSupportModel = (user) => {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    organisation: user.primaryOrganisation ? {
      name: user.primaryOrganisation
    } : null,
    organisations: user.organisations,
    lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
    successfulLoginsInPast12Months: user.numberOfSuccessfulLoginsInPast12Months,
    status: mapUserStatus(user.statusId, user.statusLastChangedOn),
    pendingEmail: user.pendingEmail,
  };
};
const mapSearchDeviceToSupportModel = (device) => {
  let status = 'Unassigned';
  if (device.statusId === 2) {
    status = 'Assigned';
  } else if (device.statusId === 3) {
    status = 'Deactivated';
  }
  return {
    organisation: device.organisationName ? {
      name: device.organisationName,
    } : null,
    lastLogin: device.lastLogin ? new Date(device.lastLogin) : null,
    device: {
      status,
      serialNumber: device.serialNumber,
      serialNumberFormatted: `${device.serialNumber.substr(0, 2)}-${device.serialNumber.substr(2, 7)}-${device.serialNumber.substr(9, 1)}`,
    },
    id: device.assigneeId,
    name: device.assignee,
  };
};
const mapSupportUserSortByToSearchApi = (supportSortBy) => {
  switch (supportSortBy.toLowerCase()) {
    case 'name':
      return 'searchableName';
    case 'email':
      return 'searchableEmail';
    case 'organisation':
      return 'primaryOrganisation';
    case 'lastlogin':
      return 'lastLogin';
    case 'status':
      return 'statusId';
    default:
      throw new Error(`Unexpected user sort field ${supportSortBy}`);
  }
};
const mapSupportDeviceSortByToSearchApi = (supportSortBy) => {
  switch (supportSortBy.toLowerCase()) {
    case 'serialnumber':
      return 'serialNumber';
    case 'status':
      return 'statusId';
    case 'name':
      return 'searchableAssignee';
    case 'organisation':
      return 'searchableOrganisationName';
    case 'lastlogin':
      return 'lastLogin';
    default:
      throw new Error(`Unexpected device sort field ${supportSortBy}`);
  }
};


const searchForUsers = async (criteria, pageNumber, sortBy, sortDirection, filters) => {
  try {
    let endpoint = `/users?criteria=${criteria}&page=${pageNumber}`;
    if (sortBy) {
      endpoint += `&sortBy=${mapSupportUserSortByToSearchApi(sortBy)}`;
    }
    if (sortDirection) {
      endpoint += `&sortDirection=${sortDirection}`;
    }
    if (filters) {
      const properties = Object.keys(filters);
      properties.forEach((property) => {
        const values = filters[property];
        endpoint += values.map(v => `&filter_${property}=${v}`).join('');
      });
    }
    const results = await callApi(endpoint, 'GET');
    return {
      numberOfPages: results.numberOfPages,
      totalNumberOfResults: results.totalNumberOfResults,
      users: results.users.map(mapSearchUserToSupportModel)
    }
  } catch (e) {
    throw new Error(`Error searching for users with criteria ${criteria} (page: ${pageNumber}) - ${e.message}`);
  }
};

// TODO: Add correllation ID
const getSearchDetailsForUserById = async (id) => {
  try {
    const user = await callApi(`/users/${id}`, 'GET');
    return user ? mapSearchUserToSupportModel(user) : undefined;
  } catch (e) {
    throw new Error(`Error getting user ${id} from search - ${e.message}`);
  }
};

const updateUserInSearch = async (user, correlationId) => {
  const body = {
    pendingEmail: user.pendingEmail,
    statusId: user.status.id,
    firstName: user.firstName,
    lastName: user.lastName,
  };
  await callApi(`/users/${user.id}`, 'PATCH', body, correlationId);
};


const searchForDevices = async (criteria, pageNumber, sortBy, sortDirection) => {
  try {
    let endpoint = `/devices?criteria=${criteria}&page=${pageNumber}`;
    if (sortBy) {
      endpoint += `&sortBy=${mapSupportDeviceSortByToSearchApi(sortBy)}`;
    }
    if (sortDirection) {
      endpoint += `&sortDirection=${sortDirection}`;
    }
    const results = await callApi(endpoint, 'GET');
    return {
      numberOfPages: results.numberOfPages,
      totalNumberOfResults: results.totalNumberOfResults,
      userDevices: results.devices.map(mapSearchDeviceToSupportModel)
    }
  } catch (e) {
    throw new Error(`Error searching for devices with criteria ${criteria} (page: ${pageNumber}) - ${e.message}`);
  }
};

const getSearchDetailsForDeviceBySerialNumber = async (serialNumber, correlationId) => {
  try {
    const device = await callApi(`/devices/${serialNumber}`, 'GET', undefined, correlationId);
    return device ? mapSearchDeviceToSupportModel(device) : undefined;
  } catch (e) {
    throw new Error(`Error getting device ${serialNumber} from search - ${e.message}`);
  }
};

const updateDeviceInSearch = async (device, correlationId) => {
  let statusId = 1;
  if (device.device.status === 'Assigned') {
    statusId = 2;
  } else if (device.device.status === 'Deactivated') {
    statusId = 3;
  }
  const body = {
    assigneeId: device.id || null,
    assignee: device.name || null,
    organisationName: device.organisation ? device.organisation.name : null,
    statusId,
  };
  await callApi(`/devices/${device.device.serialNumber}`, 'PATCH', body, correlationId);
};

const updateIndex = async (userId, body, correlationId) => {
  await callApi(`/users/${userId}`, 'PATCH', body, correlationId);
};

const createIndex = async (id, correlationId) => {
  const body = {
    id
  };
  await callApi('/users/update-index', 'POST', body, correlationId);
};

module.exports = {
  searchForUsers,
  getSearchDetailsForUserById,
  updateUserInSearch,
  searchForDevices,
  getSearchDetailsForDeviceBySerialNumber,
  updateDeviceInSearch,
  updateIndex,
  createIndex,
};
