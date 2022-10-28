const logger = require('./../../infrastructure/logger');
const {
  searchForUsers,
  getSearchDetailsForUserById,
  updateUserInSearch,
} = require('./../../infrastructure/search');
const {
  getInvitation,
  createUserDevice,
  getUser,
} = require('./../../infrastructure/directories');
const {
  getServicesByUserId,
  getServicesByInvitationId,
} = require('./../../infrastructure/access');
const { getServiceById } = require('./../../infrastructure/applications');
const { mapUserStatus } = require('./../../infrastructure/utils');
const config = require('./../../infrastructure/config');
const sortBy = require('lodash/sortBy');
const isEmpty = require('lodash/isEmpty');

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

  const selectedOrganisationTypes = unpackMultiSelect(
    paramsSource.organisationType
  );
  if (selectedOrganisationTypes) {
    filter.organisationCategories = selectedOrganisationTypes;
  }

  const selectedAccountStatuses = unpackMultiSelect(paramsSource.accountStatus);
  if (selectedAccountStatuses) {
    filter.statusId = selectedAccountStatuses;
  }

  const selectedServices = unpackMultiSelect(paramsSource.service);
  if (selectedServices) {
    filter.services = selectedServices;
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
};

const search = async (req) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;
  let criteria = paramsSource.criteria ? paramsSource.criteria.trim() : '';

  const userRegex = /^[^±!£$%^&*+§¡€#¢§¶•ªº«\\/<>?:;|=,~"]{1,256}$/i;
  let filteredError;
  /**
   * Check minimum characters and special characters in search criteria if:
   * user is not using the filters toggle (to open or close) and filters are not visible
   */
  if (
    paramsSource.isFilterToggle !== 'true' &&
    paramsSource.showFilters !== 'true'
  ) {
    if (!criteria || criteria.length < 4) {
      return {
        validationMessages: {
          criteria: 'Please enter at least 4 characters',
        },
      };
    }
    if (!userRegex.test(criteria)) {
      return {
        validationMessages: {
          criteria: 'Special characters cannot be used',
        },
      };
    }
    /**
     * Check special characters in search criteria if:
     * user is filtering filtering and had specified a criteria
     */
  } else if (!userRegex.test(criteria) && criteria.length > 0) {
    criteria = '';
    // here we normally just return the error but we
    // want to keep the last set of filtered results
    // and append the error to the result
    filteredError = {
      criteria: 'Special characters cannot be used',
    };
  }

  let safeCriteria = criteria;
  if (criteria.indexOf('-') !== -1) {
    criteria = "\"" + criteria + "\"";
  }

  let page = paramsSource.page ? parseInt(paramsSource.page) : 1;
  if (isNaN(page)) {
    page = 1;
  }

  let sortBy = paramsSource.sort ? paramsSource.sort.toLowerCase() : 'name';
  let sortAsc =
    (paramsSource.sortdir ? paramsSource.sortdir : 'asc').toLowerCase() ===
    'asc';

  const filter = buildFilters(paramsSource);

  const results = await searchForUsers(
    criteria + '*',
    page,
    sortBy,
    sortAsc ? 'asc' : 'desc',
    filter
  );
  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) searched for users in support using criteria "${criteria}"`,
    {
      type: 'support',
      subType: 'user-search',
      userId: req.user.sub,
      userEmail: req.user.email,
      criteria,
      pageNumber: page,
      numberOfPages: results.numberOfPages,
      sortedBy: sortBy,
      sortDirection: sortAsc ? 'asc' : 'desc',
    }
  );

  return {
    criteria: safeCriteria,
    page,
    sortBy,
    sortOrder: sortAsc ? 'asc' : 'desc',
    numberOfPages: results.numberOfPages,
    totalNumberOfResults: results.totalNumberOfResults,
    users: results.users,
    validationMessages: filteredError,
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
        nextDirection:
          sortBy === 'organisation' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'organisation',
      },
      lastLogin: {
        nextDirection:
          sortBy === 'lastlogin' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'lastlogin',
      },
      status: {
        nextDirection: sortBy === 'status' ? (sortAsc ? 'desc' : 'asc') : 'asc',
        applied: sortBy === 'status',
      },
    },
  };
};

const getUserDetails = async (req) => {
  return getUserDetailsById(req.params.uid, req.id);
};

const mapUserToSupportModel = (user, userFromSearch) => {
  return {
    id: user.sub,
    name: `${user.given_name} ${user.family_name}`,
    firstName: user.given_name,
    lastName: user.family_name,
    email: user.email,
    organisation: userFromSearch.primaryOrganisation
      ? {
          name: userFromSearch.primaryOrganisation,
        }
      : null,
    organisations: userFromSearch.organisations,
    lastLogin: userFromSearch.lastLogin
      ? new Date(userFromSearch.lastLogin)
      : null,
    successfulLoginsInPast12Months:
      userFromSearch.numberOfSuccessfulLoginsInPast12Months,
    status: mapUserStatus(
      userFromSearch.status.id,
      userFromSearch.statusLastChangedOn
    ),
    pendingEmail: userFromSearch.pendingEmail,
  };
};

const getUserDetailsById = async (uid, correlationId) => {
  if (uid.startsWith('inv-')) {
    const invitation = await getInvitation(uid.substr(4), correlationId);
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
      deactivated: invitation.deactivated,
    };
  } else {
    const userSearch = await getSearchDetailsForUserById(uid);
    const rawUser = await getUser(uid, correlationId);
    const user = mapUserToSupportModel(rawUser, userSearch);
    const serviceDetails = await getServicesByUserId(uid, correlationId);

    const ktsDetails = serviceDetails
      ? serviceDetails.find(
          (c) =>
            c.serviceId.toLowerCase() ===
            config.serviceMapping.key2SuccessServiceId.toLowerCase()
        )
      : undefined;
    let externalIdentifier = '';
    if (ktsDetails && ktsDetails.identifiers) {
      const key = ktsDetails.identifiers.find((a) => (a.key = 'k2s-id'));
      if (key) {
        externalIdentifier = key.value;
      }
    }

    const isLegacyIdPresent = (user) => {
      if (isEmpty(user?.numericIdentifier && user?.textIdentifier)) return true;

      return false;
    };

    const numericAndTextIdentifierCheck = isLegacyIdPresent(
      userSearch.organisations
    );

    const numeriIdentifierAndTextidentifier = {};
    userSearch.organisations?.map((org) => {
      if (org['numericIdentifier'] && org['textIdentifier']) {
        numeriIdentifierAndTextidentifier['numericIdentifier'] =
          org['numericIdentifier'];
        numeriIdentifierAndTextidentifier['textIdentifier'] =
          org['textIdentifier'];
      }
    });

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
      orgId: ktsDetails ? ktsDetails.organisationId : '',
      ktsId: externalIdentifier,
      pendingEmail: user.pendingEmail,
      ...(numericAndTextIdentifierCheck && {
        legacyId: JSON.stringify(numeriIdentifierAndTextidentifier),
      }),
    };
  }
};

const updateUserDetails = async (user, correlationId) => {
  await updateUserInSearch(user, correlationId);
};

const getAllServicesForUserInOrg = async (
  userId,
  organisationId,
  correlationId
) => {
  const allUserServices = userId.startsWith('inv-')
    ? await getServicesByInvitationId(userId.substr(4), correlationId)
    : await getServicesByUserId(userId, correlationId);
  if (!allUserServices) {
    return [];
  }

  const userServicesForOrg = allUserServices.filter(
    (x) => x.organisationId === organisationId
  );
  const services = userServicesForOrg.map((service) => ({
    id: service.serviceId,
    dateActivated: service.accessGrantedOn,
    name: '',
    status: null,
  }));
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const application = await getServiceById(service.id);
    service.name = application.name;
    service.status = mapUserStatus(service.status);
  }
  return sortBy(services, 'name');
};

const createDevice = async (req) => {
  const userId = req.body.userId;
  const userEmail = req.body.email;
  const serialNumber = req.body.serialNumber;

  const result = await createUserDevice(userId, serialNumber, req.id);

  if (result.success) {
    logger.audit(
      `Support user ${req.user.email} (id: ${req.user.sub}) linked ${userEmail} (id: ${userId}) linked to token ${serialNumber} "${serialNumber}"`,
      {
        type: 'support',
        subType: 'digipass-assign',
        success: true,
        editedUser: userId,
        userId: req.user.sub,
        userEmail: req.user.email,
        deviceSerialNumber: serialNumber,
      }
    );
  } else {
    logger.audit(
      `Support user ${req.user.email} (id: ${req.user.sub}) failed to link ${userEmail} (id: ${userId}) to token ${serialNumber} "${serialNumber}"`,
      {
        type: 'support',
        subType: 'digipass-assign',
        success: false,
        editedUser: userId,
        userId: req.user.sub,
        userEmail: req.user.email,
        deviceSerialNumber: serialNumber,
      }
    );
  }
  return result.success;
};

const waitForIndexToUpdate = async (uid, updatedCheck) => {
  const abandonTime = Date.now() + 10000;
  let hasBeenUpdated = false;
  while (!hasBeenUpdated && Date.now() < abandonTime) {
    const updated = await getSearchDetailsForUserById(uid);
    if (updatedCheck) {
      hasBeenUpdated = updatedCheck(updated);
    } else {
      hasBeenUpdated = updated;
    }
    if (!hasBeenUpdated) {
      await delay(200);
    }
  }
};

const mapRole = (roleId) => {
  if (roleId === 10000) {
    return { id: 10000, description: 'Approver' };
  }
  return { id: 0, description: 'End user' };
};

module.exports = {
  search,
  getUserDetails,
  getUserDetailsById,
  updateUserDetails,
  createDevice,
  waitForIndexToUpdate,
  getAllServicesForUserInOrg,
  mapRole,
};
