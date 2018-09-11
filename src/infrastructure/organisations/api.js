const jwtStrategy = require('login.dfe.jwt-strategies');
const config = require('./../config');
const KeepAliveAgent = require('agentkeepalive').HttpsAgent;
const rp = require('login.dfe.request-promise-retry').defaults({
  agent: new KeepAliveAgent({
    maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
    maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
    timeout: config.hostingEnvironment.agentKeepAlive.timeout,
    keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
  }),
});
const promiseRetry = require('promise-retry');

const callOrganisationsApi = async (endpoint, method, body, correlationId) => {
  const token = await jwtStrategy(config.organisations.service).getBearerToken();

  const numberOfRetires = config.organisations.service.numberOfRetries || 3;
  const retryFactor = config.organisations.service.retryFactor || 2;

  return promiseRetry(async (retry, number) => {
      try {
        return await rp({
          method: method,
          uri: `${config.organisations.service.url}/${endpoint}`,
          headers: {
            authorization: `bearer ${token}`,
            'x-correlation-id': correlationId,
          },
          body: body,
          json: true,
          strictSSL: config.hostingEnvironment.env.toLowerCase() !== 'dev',
        });
      } catch (e) {
        const status = e.statusCode ? e.statusCode : 500;
        if (status === 401 || status === 404) {
          return null;
        }
        if (status === 409) {
          return false;
        }
        if ((status === 500 || status === 503) && number < numberOfRetires) {
          retry();
        }
        throw e;
      }
    }, { factor: retryFactor }
  );


};

const getUserOrganisations = async (userId, correlationId) => {
  return await callOrganisationsApi(`organisations/associated-with-user/${userId}`, 'GET', undefined, correlationId);
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
  return callOrganisationsApi(`organisations/${organisationId}/invitations/${invitationId}`, 'DELETE', correlationId);
};

const getServicesByUserId = async (id, reqId) => {
  return await callOrganisationsApi(`services/associated-with-user/${id}`, 'GET', undefined, reqId);
};

const putSingleServiceIdentifierForUser = async (userId, serviceId, orgId, value, reqId) => {
  const body = {
    id_key: 'k2s-id',
    id_value: value
  };
  const result = await callOrganisationsApi(`organisations/${orgId}/services/${serviceId}/identifiers/${userId}`, 'PUT', body, reqId);
  return result === undefined;
};

const searchOrganisations = async (criteria, filterByCategories, pageNumber, correlationId) => {
  let uri = `organisations?search=${criteria}&page=${pageNumber}`;
  if (filterByCategories) {
    filterByCategories.forEach((category) => {
      uri += `&filtercategory=${category}`;
    });
  }
  return await callOrganisationsApi(uri, 'GET', undefined, correlationId);
};

const setUserAccessToOrganisation = async (userId, organisationId, roleId, correlationId, status, reason,) => {
  const body = { roleId, status,reason };
  return await callOrganisationsApi(`organisations/${organisationId}/users/${userId}`, 'PUT', body, correlationId);
};

const deleteUserOrganisation = async (userId, organisationId, correlationId)  => {
  return callOrganisationsApi(`organisations/${organisationId}/users/${userId}`, 'DELETE', correlationId);
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

module.exports = {
  getUserOrganisations,
  getInvitationOrganisations,
  getServiceById,
  getPageOfOrganisations,
  getAllOrganisations,
  getAllServices,
  getOrganisationById,
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
};
