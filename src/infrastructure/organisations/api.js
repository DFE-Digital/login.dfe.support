const jwtStrategy = require('login.dfe.jwt-strategies');
const config = require('./../config');
const { fetchApi } = require('login.dfe.async-retry');

const callOrganisationsApi = async (endpoint, method, body, correlationId) => {
  const token = await jwtStrategy(config.organisations.service).getBearerToken();

  try {
    return await fetchApi(`${config.organisations.service.url}/${endpoint}`, {
      method,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body,
    });
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 401 || status === 404) {
      return null;
    }
    if (status === 409) {
      return false;
    }
    throw e;
  }
};

const getUserOrganisations = async (userId, correlationId) => {
  return await callOrganisationsApi(`organisations/associated-with-user/${userId}`, 'GET', undefined, correlationId);
};

const getUserOrganisationsV2 = async (userId, correlationId) => {
  return await callOrganisationsApi(`organisations/v2/associated-with-user/${userId}`, 'GET', undefined, correlationId);
};

const getInvitationOrganisations = async (invitationId, correlationId) => {
  return await callOrganisationsApi(`invitations/v2/${invitationId}`, 'GET', undefined, correlationId);
};

const getServiceById = async (serviceId, correlationId) => {
  return await callOrganisationsApi(`services/${serviceId}`, 'GET', undefined, correlationId);
};

const getPageOfOrganisations = async (pageNumber, correlationId) => {
  return await callOrganisationsApi(`organisations?page=${pageNumber}`, 'GET', undefined, correlationId);
};

const getAllOrganisations = async () => {
  const all = [];

  let pageNumber = 1;
  let hasMorePages = true;
  while (hasMorePages) {
    const page = await getPageOfOrganisations(pageNumber);
    page.organisations.forEach((org) => {
      all.push(org);
    });

    pageNumber++;
    hasMorePages = pageNumber <= page.totalNumberOfPages;
  }

  return all;
};

const getAllServices = async (correlationId) => {
  return await callOrganisationsApi('services', 'GET', undefined, correlationId);
};

const getOrganisationById = async (id, correlationId) => {
  return await callOrganisationsApi(`organisations/${id}`, 'GET', undefined, correlationId);
};

const getOrganisationByIdV2 = async (id, correlationId) => {
  return await callOrganisationsApi(`organisations/v2/${id}`, 'GET', undefined, correlationId);
};

const getServiceIdentifierDetails = async (serviceId, identifierKey, identifierValue, correlationId) => {
  return await callOrganisationsApi(`services/${serviceId}/identifiers/${identifierKey}/${identifierValue}`, 'GET', undefined, correlationId);
};

const addInvitationService = async (invitationId, organisationId, serviceId, roleId, externalIdentifiers, correlationId) => {
  const body = {
    roleId,
    externalIdentifiers,
  };

  return await callOrganisationsApi(`organisations/${organisationId}/services/${serviceId}/invitations/${invitationId}`, 'PUT', body, correlationId);
};

const addInvitationOrganisation = async (invitationId, organisationId, roleId, correlationId) => {
  const body = {
    roleId,
  };
  return await callOrganisationsApi(`organisations/${organisationId}/invitations/${invitationId}`, 'PUT', body, correlationId);
};

const deleteInvitationOrganisation = async (invitationId, organisationId, correlationId) => {
  return callOrganisationsApi(`organisations/${organisationId}/invitations/${invitationId}`, 'DELETE', undefined, correlationId);
};

const getServicesByUserId = async (id, reqId) => {
  return await callOrganisationsApi(`services/associated-with-user/${id}`, 'GET', undefined, reqId);
};

const putSingleServiceIdentifierForUser = async (userId, serviceId, orgId, value, reqId) => {
  const body = {
    id_key: 'k2s-id',
    id_value: value,
  };
  const result = await callOrganisationsApi(`organisations/${orgId}/services/${serviceId}/identifiers/${userId}`, 'PUT', body, reqId);
  return result === undefined;
};

const searchOrganisations = async (criteria, filterByCategories, filterByStatus, pageNumber, correlationId) => {
  let uri = `organisations?search=${criteria}&page=${pageNumber}`;
  if (filterByCategories) {
    uri += filterByCategories.map(f => `&filtercategory=${f}`).join('');
  }
  if (filterByStatus) {
    uri += filterByStatus.map(f => `&filterstatus=${f}`).join('');
  }
  return await callOrganisationsApi(uri, 'GET', undefined, correlationId);
};

const setUserAccessToOrganisation = async (userId, organisationId, roleId, correlationId, status, reason) => {
  const body = { roleId, status, reason };
  return await callOrganisationsApi(`organisations/${organisationId}/users/${userId}`, 'PUT', body, correlationId);
};

const deleteUserOrganisation = async (userId, organisationId, correlationId) => {
  return callOrganisationsApi(`organisations/${organisationId}/users/${userId}`, 'DELETE', undefined, correlationId);
};

const getOrganisationCategories = async (correlationId) => {
  return callOrganisationsApi('organisations/categories', 'GET', undefined, correlationId);
};

const getOrganisationUsersForApproval = async (pageNumber, correlationId) => {
  return callOrganisationsApi(`organisations/users-for-approval?page=2`, 'GET', undefined, correlationId);
};

const listUserServices = async (page, pageSize, correlationId) => {
  return callOrganisationsApi(`/services/associated-with-user?page=${page}&pageSize=${pageSize}`, 'GET', undefined, correlationId);
};

const listInvitationServices = async (page, pageSize, correlationId) => {
  return callOrganisationsApi(`/invitations?page=${page}&pageSize=${pageSize}`, 'GET', undefined, correlationId);
};

const listOrganisationStatus = async (correlationId) => {
  return callOrganisationsApi('organisations/states', 'GET', undefined, correlationId);
};

const createOrganisation = async (body, correlationId) => {
  return callOrganisationsApi(`organisations/`, 'POST', body, correlationId);
};

const listRequests = async (page, filterStates, correlationId) => {
  let uri = `organisations/requests?page=${page}`;
  if (filterStates && filterStates.length > 0) {
    filterStates.forEach((status) => {
      uri += `&filterstatus=${status}`;
    });
  } else {
    uri += '&filterstatus=0&filterstatus=2&filterstatus=3';
  }
  return callOrganisationsApi(uri, 'GET', undefined, correlationId);
};

const getRequestById = async (requestId, correlationId) => {
  return callOrganisationsApi(`organisations/requests/${requestId}`, 'GET', undefined, correlationId);
};

const updateRequestById = async (requestId, status, actionedBy, actionedReason, actionedAt, correlationId) => {
  const body = {};
  if (status) {
    body.status = status;
  }
  if (actionedBy) {
    body.actioned_by = actionedBy;
  }
  if (actionedReason) {
    body.actioned_reason = actionedReason;
  }
  if (actionedAt) {
    body.actioned_at = actionedAt;
  }
  return callOrganisationsApi(`organisations/requests/${requestId}`, 'PATCH', body, correlationId);
};

const putUserInOrganisation = async (userId, orgId, status, role, reason, correlationId) => {
  return callOrganisationsApi(`organisations/${orgId}/users/${userId}`, 'PUT', { roleId: role, status, reason }, correlationId);
};

const getPendingRequestsAssociatedWithUser = async (userId, correlationId) => {
  return callOrganisationsApi(`organisations/requests-for-user/${userId}`, 'GET', undefined, correlationId);
};

const getCategories = async () => {
  return await callOrganisationsApi('organisations/categories', 'GET',undefined, undefined);
}

module.exports = {
  createOrganisation,
  getUserOrganisations,
  getInvitationOrganisations,
  getServiceById,
  getPageOfOrganisations,
  getAllOrganisations,
  getAllServices,
  getOrganisationById,
  getOrganisationByIdV2,
  getServiceIdentifierDetails,
  addInvitationService,
  addInvitationOrganisation,
  getServicesByUserId,
  putSingleServiceIdentifierForUser,
  searchOrganisations,
  setUserAccessToOrganisation,
  getOrganisationCategories,
  getOrganisationUsersForApproval,
  listUserServices,
  listInvitationServices,
  deleteUserOrganisation,
  deleteInvitationOrganisation,
  getUserOrganisationsV2,
  listRequests,
  getRequestById,
  updateRequestById,
  putUserInOrganisation,
  listOrganisationStatus,
  getPendingRequestsAssociatedWithUser,
  getCategories,
};
