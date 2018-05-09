const users = require('./../../infrastructure/users');
const logger = require('./../../infrastructure/logger');
const { getUser, getInvitation, createUserDevice } = require('./../../infrastructure/directories');
const { getServicesByUserId } = require('./../../infrastructure/organisations');
const { mapUserStatus } = require('./../../infrastructure/utils');
const config = require('./../../infrastructure/config');

const delay = async (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};
const unpackMultiSelect = (parameter) => {
  if (!parameter) {
    return [];
  }
  if (!(parameter instanceof Array)) {
    return [parameter];
  }
  return parameter;
};
const buildFilters = (paramsSource) => {
  let filter = {};

  const selectedOrganisationTypes = unpackMultiSelect(paramsSource.organisationType);
  if (selectedOrganisationTypes) {
    filter.organisationType = selectedOrganisationTypes
  }

  const selectedAccountStatuses = unpackMultiSelect(paramsSource.accountStatus);
  if (selectedAccountStatuses) {
    filter.accountStatus = selectedAccountStatuses
  }

  const selectedServices = unpackMultiSelect(paramsSource.service);
  if (selectedServices) {
    filter.service = selectedServices
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
};

const search = async (req) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;

  let criteria = paramsSource.criteria;
  if (!criteria) {
    criteria = '';
  }

  let page = paramsSource.page ? parseInt(paramsSource.page) : 1;
  if (isNaN(page)) {
    page = 1;
  }

  let sortBy = paramsSource.sort ? paramsSource.sort.toLowerCase() : 'name';
  let sortAsc = (paramsSource.sortdir ? paramsSource.sortdir : 'asc').toLowerCase() === 'asc';

  const filter = buildFilters(paramsSource);

  const results = await users.search(criteria + '*', page, sortBy, sortAsc, filter);
  logger.audit(`${req.user.email} (id: ${req.user.sub}) searched for users in support using criteria "${criteria}"`, {
    type: 'support',
    subType: 'user-search',
    userId: req.user.sub,
    userEmail: req.user.email,
    criteria: criteria,
    pageNumber: page,
    numberOfPages: results.numberOfPages,
    sortedBy: sortBy,
    sortDirection: sortAsc ? 'asc' : 'desc',
  });

  return {
    criteria,
    page,
    sortBy,
    sortOrder: sortAsc ? 'asc' : 'desc',
    numberOfPages: results.numberOfPages,
    totalNumberOfResults: results.totalNumberOfResults,
    users: results.users,
    sort: {
      name: {
        nextDirection: sortBy === 'name' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'name',
      },
      email: {
        nextDirection: sortBy === 'email' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'email',
      },
      organisation: {
        nextDirection: sortBy === 'organisation' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'organisation',
      },
      lastLogin: {
        nextDirection: sortBy === 'lastlogin' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'lastlogin',
      },
      status: {
        nextDirection: sortBy === 'status' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'status',
      },
    }
  };
};

const getUserDetails = async (req) => {
  const uid = req.params.uid;
  if (uid.startsWith('inv-')) {
    const invitation = await getInvitation(uid.substr(4), req.id);
    return {
      id: uid,
      name: `${invitation.firstName} ${invitation.lastName}`,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      email: invitation.email,
      lastLogin: null,
      status: invitation.deactivated ? mapUserStatus(-2) : mapUserStatus(-1),
      loginsInPast12Months: {
        successful: 0,
      },
      deactivated: invitation.deactivated
    };
  } else {
    const user = await users.getById(uid);
    const serviceDetails = await getServicesByUserId(uid);

    const ktsDetails = serviceDetails ? serviceDetails.find((c) => c.id.toLowerCase() === config.serviceMapping.key2SuccessServiceId.toLowerCase()) : undefined;
    let externalIdentifier = '';
    if (ktsDetails && ktsDetails.externalIdentifiers) {
      const key = ktsDetails.externalIdentifiers.find((a) => a.key = 'k2s-id');
      if (key) {
        externalIdentifier = key.value;
      }
    }

    return {
      id: uid,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      lastLogin: user.lastLogin,
      status: user.status,
      loginsInPast12Months: {
        successful: user.successfulLoginsInPast12Months,
      },
      serviceId: config.serviceMapping.key2SuccessServiceId,
      orgId: ktsDetails ? ktsDetails.organisation.id : '',
      ktsId: externalIdentifier,
      pendingEmail: user.pendingEmail,
    };
  }
};

const createDevice = async (req) => {

  const userId = req.body.userId;
  const userEmail = req.body.email;
  const serialNumber = req.body.serialNumber;

  const result = await createUserDevice(userId, serialNumber, req.id);

  if (result.success) {
    logger.audit(`Support user ${req.user.email} (id: ${req.user.sub}) linked ${userEmail} (id: ${userId}) linked to token ${serialNumber} "${serialNumber}"`, {
      type: 'support',
      subType: 'digipass-assign',
      success: true,
      editedUser: userId,
      userId: req.user.sub,
      userEmail: req.user.email,
      deviceSerialNumber: serialNumber,
    });
  } else {
    logger.audit(`Support user ${req.user.email} (id: ${req.user.sub}) failed to link ${userEmail} (id: ${userId}) to token ${serialNumber} "${serialNumber}"`, {
      type: 'support',
      subType: 'digipass-assign',
      success: false,
      editedUser: userId,
      userId: req.user.sub,
      userEmail: req.user.email,
      deviceSerialNumber: serialNumber,
    });
  }
  return result.success;
};

const waitForIndexToUpdate = async (uid, updatedCheck) => {
  const abadonTime = Date.now() + 2000;
  let hasBeenUpdated = false;
  while (!hasBeenUpdated && Date.now() < abadonTime) {
    const updated = await users.getById(uid);
    hasBeenUpdated = updatedCheck(updated);
    if (!hasBeenUpdated) {
      delay(200);
    }
  }
};

module.exports = {
  search,
  getUserDetails,
  createDevice,
  waitForIndexToUpdate,
};
