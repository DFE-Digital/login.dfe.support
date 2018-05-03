const jwtStrategy = require('login.dfe.jwt-strategies');
const config = require('./../config');
const KeepAliveAgent = require('agentkeepalive').HttpsAgent;
const rp = require('request-promise').defaults({
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
    },{factor: retryFactor}
  );


};

const getUserOrganisations = async (userId, correlationId) => {
  return await callOrganisationsApi(`organisations/associated-with-user/${userId}`, 'GET', undefined, correlationId);
};

const getInvitationOrganisations = async (invitationId, correlationId) => {
  return await callOrganisationsApi(`invitations/${invitationId}`, 'GET', undefined, correlationId);
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

const getServicesByUserId = async (id, reqId) => {
  return await callOrganisationsApi(`services/associated-with-user/${id}`, 'GET', undefined, reqId);
};

const putSingleServiceIdentifierForUser = async (userId, serviceId, orgId, value, reqId) => {
  const body = {
    id_key: 'k2s-id',
    id_value: value
  };
  return await callOrganisationsApi(`organisations/${orgId}/services/${serviceId}/identifiers/${userId}`, 'PUT', body, reqId);
};

const searchOrganisations = async (criteria, pageNumber, correlationId) => {
  return await callOrganisationsApi(`organisations?search=${criteria}&page=${pageNumber}`, 'GET', undefined, correlationId);
};

module.exports = {
  getUserOrganisations,
  getInvitationOrganisations,
  getServiceById,
  getPageOfOrganisations,
  getAllOrganisations,
  getOrganisationById,
  getServiceIdentifierDetails,
  addInvitationService,
  addInvitationOrganisation,
  getServicesByUserId,
  putSingleServiceIdentifierForUser,
  searchOrganisations,
};
