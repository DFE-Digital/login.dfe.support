const logger = require("./../../infrastructure/logger");
const {
  getUserServicesRaw,
  deleteUserServiceAccess,
  getUserServiceRequestsRaw,
  getUserRaw,
  updateUserDetailsInSearchIndex,
  getPendingRequestsRaw,
} = require("login.dfe.api-client/users");
const {
  updateServiceRequest,
  getServiceRaw,
} = require("login.dfe.api-client/services");
const {
  getInvitationServicesRaw,
  deleteServiceAccessFromInvitation,
  getInvitationRaw,
} = require("login.dfe.api-client/invitations");

const { mapUserStatus } = require("./../../infrastructure/utils");
const config = require("./../../infrastructure/config");
const sortBy = require("lodash/sortBy");
const {
  getSearchDetailsForUserById,
} = require("./userSearchHelpers/getSearchDetailsForUserById");
const { searchAndMapUsers } = require("./userSearchHelpers/searchAndMapUsers");
const {
  updateRequestForOrganisationRaw,
} = require("login.dfe.api-client/organisations");
const { dateFormat } = require("../helpers/dateFormatterHelper");

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
    paramsSource.organisationType || paramsSource.organisationCategories,
  );
  if (selectedOrganisationTypes) {
    filter.organisationCategories = selectedOrganisationTypes;
  }

  const selectedAccountStatuses = unpackMultiSelect(
    paramsSource.accountStatus || paramsSource.statusId,
  );
  if (selectedAccountStatuses) {
    filter.statusId = selectedAccountStatuses;
  }

  const selectedServices = unpackMultiSelect(
    paramsSource.service || paramsSource.services,
  );
  if (selectedServices) {
    filter.serviceIds = selectedServices;
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
};

const search = async (req) => {
  let paramsSource = req.method === "POST" ? req.body : req.query;

  if (Object.keys(paramsSource).length === 0 && req.session.params) {
    paramsSource = {
      ...req.session.params,
    };
  }

  if (paramsSource.services) {
    paramsSource = { ...paramsSource, service: paramsSource.services };
  }

  let criteria = paramsSource.criteria ? paramsSource.criteria.trim() : "";

  const userRegex = /^[^±!£$%^&*§¡€#¢§¶•ªº«\\/<>?:;|=,~"]{1,256}$/i;
  let filteredError;
  /**
   * Check minimum characters and special characters in search criteria if:
   * user is not using the filters toggle (to open or close) and filters are not visible
   */
  if (
    paramsSource.isFilterToggle !== "true" &&
    paramsSource.showFilters !== "true"
  ) {
    if (!criteria || criteria.length < 4) {
      return {
        validationMessages: {
          criteria: "Please enter at least 4 characters",
        },
      };
    }
    if (!userRegex.test(criteria)) {
      return {
        validationMessages: {
          criteria: "Special characters cannot be used",
        },
      };
    }
    /**
     * Check special characters in search criteria if:
     * user is filtering filtering and had specified a criteria
     */
  } else if (!userRegex.test(criteria) && criteria.length > 0) {
    criteria = "";
    // here we normally just return the error but we
    // want to keep the last set of filtered results
    // and append the error to the result
    filteredError = {
      criteria: "Special characters cannot be used",
    };
  }

  let safeCriteria = criteria;
  if (criteria.indexOf("-") !== -1) {
    criteria = '"' + criteria + '"';
  }

  let page = paramsSource.page ? parseInt(paramsSource.page) : 1;
  if (isNaN(page)) {
    page = 1;
  }

  let sortBy = paramsSource.sort ? paramsSource.sort.toLowerCase() : "name";
  let sortAsc =
    (paramsSource.sortDir ? paramsSource.sortDir : "asc").toLowerCase() ===
    "asc";

  const filter = buildFilters(paramsSource);
  const results = await searchAndMapUsers({
    criteria: `${criteria}*`,
    pageNumber: page,
    sortAsc,
    sortBy,
    filterBy: filter,
  });
  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) searched for users in support using criteria "${criteria}"`,
    {
      type: "support",
      subType: "user-search",
      userId: req.user.sub,
      userEmail: req.user.email,
      criteria,
      pageNumber: page,
      numberOfPages: results.numberOfPages,
      sortedBy: sortBy,
      sortDirection: sortAsc ? "asc" : "desc",
    },
  );

  return {
    criteria: safeCriteria,
    page,
    sortBy,
    sortOrder: sortAsc ? "asc" : "desc",
    numberOfPages: results.numberOfPages,
    totalNumberOfResults: results.totalNumberOfResults,
    users: results.users,
    validationMessages: filteredError,
    sort: {
      name: {
        nextDirection: sortBy === "name" ? (sortAsc ? "desc" : "asc") : "asc",
        applied: sortBy === "name",
      },
      email: {
        nextDirection: sortBy === "email" ? (sortAsc ? "desc" : "asc") : "asc",
        applied: sortBy === "email",
      },
      organisation: {
        nextDirection:
          sortBy === "organisation" ? (sortAsc ? "desc" : "asc") : "asc",
        applied: sortBy === "organisation",
      },
      lastLogin: {
        nextDirection:
          sortBy === "lastlogin" ? (sortAsc ? "desc" : "asc") : "asc",
        applied: sortBy === "lastlogin",
      },
      status: {
        nextDirection: sortBy === "status" ? (sortAsc ? "desc" : "asc") : "asc",
        applied: sortBy === "status",
      },
    },
  };
};

/**
 * Modified user search used for the bulk user actions screen.
 * Assumes email validation has already been done.
 *
 * @param email - A string representing the email that will be searched for
 */
const searchForBulkUsersPage = async (email) => {
  let criteria = email.trim();

  if (criteria.indexOf("-") !== -1) {
    criteria = '"' + criteria + '"';
  }
  const page = 1;
  const sortBy = "name";
  const sortAsc = "asc";

  const results = await searchAndMapUsers({
    criteria: `${criteria}*`,
    pageNumber: page,
    sortAsc,
    sortBy,
  });
  return {
    users: results.users,
  };
};

const mapUserToSupportModel = (user, userFromSearch) => {
  return {
    id: user.sub,
    name: `${user.given_name} ${user.family_name}`,
    firstName: user.given_name,
    lastName: user.family_name,
    email: user.email,
    isEntra: user.isEntra,
    isInternalUser: user.isInternalUser,
    entraOid: user.entraOid,
    entraLinked: user.entraLinked,
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
      userFromSearch.statusLastChangedOn,
    ),
    pendingEmail: userFromSearch.pendingEmail,
  };
};

const checkManageAccess = async (arr) => {
  return arr.some(
    (entry) =>
      entry.serviceId === config.access.identifiers.manageServiceIdentifiers,
  );
};

const getUserDetailsById = async (uid, req) => {
  if (uid.startsWith("inv-")) {
    const invitation = await getInvitationRaw({ by: { id: uid.substr(4) } });

    const entraOid = await req.externalAuth.getEntraAccountIdByEmail(
      invitation.email,
    );

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
      entraOid,
    };
  } else {
    const userSearch = await getSearchDetailsForUserById(uid);
    const rawUser = await getUserRaw({ by: { id: uid } });
    const user = mapUserToSupportModel(rawUser, userSearch);
    const serviceDetails = await getUserServicesRaw({ userId: uid });
    const hasManageAccess = await checkManageAccess(serviceDetails ?? []);

    // No entra data in our database, check entra incase somehow the link has been broken
    if (!user.entraOid) {
      const entraData = await req.externalAuth.getEntraAccountIdByEmail(
        user.email,
      );
      if (entraData) {
        user.entraOid = entraData.id;
      }
    }

    return {
      id: uid,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isEntra: user.isEntra,
      isInternalUser: user.isInternalUser,
      entraOid: user.entraOid,
      entraLinked: user.entraLinked
        ? dateFormat(user.entraLinked, "longDateFormat")
        : null,
      entraDeferUntil:
        user.isEntra && !user.entraOid
          ? dateFormat(user.entraDeferUntil, "longDateFormat")
          : null,
      lastLogin: user.lastLogin,
      status: user.status,
      loginsInPast12Months: {
        successful: user.successfulLoginsInPast12Months,
      },
      pendingEmail: user.pendingEmail,
      serviceDetails,
      hasManageAccess,
    };
  }
};

const updateUserDetails = async (user) => {
  await updateUserDetailsInSearchIndex({
    userId: user.id,
    userPendingEmail: user.pendingEmail,
    userStatusId: user.status.id,
    userFirstName: user.firstName,
    userLastName: user.lastName,
  });
};

const getAllServicesForUserInOrg = async (userId, organisationId) => {
  const allUserServices = userId.startsWith("inv-")
    ? await getInvitationServicesRaw({ userInvitationId: userId.substr(4) })
    : await getUserServicesRaw({ userId: userId });
  if (!allUserServices) {
    return [];
  }

  const userServicesForOrg = allUserServices.filter(
    (x) => x.organisationId === organisationId,
  );
  const services = userServicesForOrg.map((service) => ({
    id: service.serviceId,
    dateActivated: service.accessGrantedOn,
    name: "",
    status: null,
  }));
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const application = await getServiceRaw({ by: { serviceId: service.id } });
    service.name = application.name;
    service.status = mapUserStatus(service.status);
  }
  return sortBy(services, "name");
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
    return { id: 10000, description: "Approver" };
  }
  return { id: 0, description: "End user" };
};

const rejectOpenUserServiceRequestsForUser = async (userId, req) => {
  const correlationId = req.id;
  const userServiceRequests =
    (await getUserServiceRequestsRaw({ userId })) || [];
  logger.info(
    `Found ${userServiceRequests.length} service request(s) for user ${userId}. Rejecting any outstanding requests.`,
    { correlationId },
  );
  for (const serviceRequest of userServiceRequests) {
    // Request status 0 is 'pending', 2 is 'overdue', 3 is 'no approvers'
    if (
      serviceRequest.status === 0 ||
      serviceRequest.status === 2 ||
      serviceRequest.status === 3
    ) {
      logger.info(`Rejecting service request with id: ${serviceRequest.id}`, {
        correlationId,
      });
      updateServiceRequest({
        serviceRequestId: serviceRequest.id,
        status: -1,
        actionedByUserId: req.user.sub,
        actionedAt: new Date(),
        reason: "User deactivation",
      });
    }
  }
};

const rejectOpenOrganisationRequestsForUser = async (userId, req) => {
  const correlationId = req.id;
  const organisationRequests = (await getPendingRequestsRaw({ userId })) || [];
  logger.info(
    `Found ${organisationRequests.length} organisation request(s) for user ${userId}. Rejecting any outstanding requests.`,
    { correlationId },
  );
  for (const organisationRequest of organisationRequests) {
    // Request status 0 is 'pending', 2 is 'overdue' and 3 is 'no approvers'
    if (
      organisationRequest.status.id === 0 ||
      organisationRequest.status.id === 2 ||
      organisationRequest.status.id === 3
    ) {
      logger.info(
        `Rejecting organisation request with id: ${organisationRequest.id}`,
        { correlationId },
      );

      updateRequestForOrganisationRaw({
        requestId: organisationRequest.id,
        status: -1,
        actionedByUserId: req.user.sub,
        reason: "User deactivation",
        actionedAt: Date.now(),
      });
    }
  }
};

const removeAllServicesForUser = async (userId, req) => {
  const correlationId = req.id;
  const userServices = (await getUserServicesRaw({ userId: userId })) || [];
  logger.info(
    `Removing ${userServices.length} service(s) from user ${userId}`,
    { correlationId },
  );
  for (const service of userServices) {
    logger.info(
      `Removing service from user: ${service.userId} with serviceId: ${service.serviceId} and organisationId: ${service.organisationId}`,
      { correlationId },
    );
    deleteUserServiceAccess({
      userId: service.userId,
      serviceId: service.serviceId,
      organisationId: service.organisationId,
    });
  }
};

const removeAllServicesForInvitedUser = async (userId, req) => {
  const correlationId = req.id;
  logger.info(`Attempting to remove services from invite with id: ${userId}`, {
    correlationId,
  });
  const invitationServiceRecords =
    (await getInvitationServicesRaw({ userInvitationId: userId.substr(4) })) ||
    [];
  for (const serviceRecord of invitationServiceRecords) {
    logger.info(
      `Deleting invitation service record for invitationId: ${serviceRecord.invitationId}, serviceId: ${serviceRecord.serviceId} and organisationId: ${serviceRecord.organisationIdId}`,
      { correlationId },
    );
    deleteServiceAccessFromInvitation({
      invitationId: serviceRecord.invitationId,
      serviceId: serviceRecord.serviceId,
      organisationId: serviceRecord.organisationId,
    });
  }
};

const callServiceToUserFunc = async (
  apiFn,
  { userId, serviceId, organisationId, serviceRoleIds },
) => {
  try {
    return await apiFn({
      userId,
      serviceId,
      organisationId,
      serviceRoleIds,
    });
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 403) {
      return false;
    }
    if (status === 409) {
      return false;
    }
    throw e;
  }
};

module.exports = {
  search,
  searchForBulkUsersPage,
  getUserDetailsById,
  updateUserDetails,
  waitForIndexToUpdate,
  getAllServicesForUserInOrg,
  mapRole,
  rejectOpenUserServiceRequestsForUser,
  rejectOpenOrganisationRequestsForUser,
  removeAllServicesForUser,
  removeAllServicesForInvitedUser,
  callServiceToUserFunc,
};
