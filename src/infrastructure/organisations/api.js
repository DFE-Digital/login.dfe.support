const rp = require('request-promise');
const jwtStrategy = require('login.dfe.jwt-strategies');
const config = require('./../config');

const getUserOrganisations = async (userId, correlationId) => {
  const token = await jwtStrategy(config.organisations.service).getBearerToken();

  try {
    const userServiceMapping = await rp({
      method: 'GET',
      uri: `${config.organisations.service.url}/organisations/associated-with-user/${userId}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });

    return userServiceMapping;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 401 || status === 404) {
      return null;
    }
    throw e;
  }
};

const getInvitationOrganisations = async (invitationId, correlationId) => {
  const token = await jwtStrategy(config.organisations.service).getBearerToken();

  try {
    const invitationServiceMapping = await rp({
      method: 'GET',
      uri: `${config.organisations.service.url}/invitations/${invitationId}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });

    return invitationServiceMapping;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 401 || status === 404) {
      return null;
    }
    throw e;
  }
};

const getServiceById = async (serviceId, correlationId) => {
  const token = await jwtStrategy(config.organisations.service).getBearerToken();

  try {
    const service = await rp({
      method: 'GET',
      uri: `${config.organisations.service.url}/services/${serviceId}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });

    return service;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 401 || status === 404) {
      return null;
    }
    throw e;
  }
};

const getPageOfOrganisations = async (pageNumber, correlationId) => {
  const token = await jwtStrategy(config.organisations.service).getBearerToken();

  try {
    const pageOfOrgs = await rp({
      method: 'GET',
      uri: `${config.organisations.service.url}/organisations?page=${pageNumber}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });

    return pageOfOrgs;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 401 || status === 404) {
      return null;
    }
    throw e;
  }
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

const getServiceIdentifierDetails = async (serviceId, identifierKey, identifierValue, correlationId) => {
  const token = await jwtStrategy(config.organisations.service).getBearerToken();

  try {
    const service = await rp({
      method: 'GET',
      uri: `${config.organisations.service.url}/services/${serviceId}/identifiers/${identifierKey}/${identifierValue}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });

    return service;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404) {
      return null;
    }
    throw e;
  }
};

const addInvitationService = async (invitationId, organisationId, serviceId, roleId, correlationId) => {
  const token = await jwtStrategy(config.organisations.service).getBearerToken();

  try {
    await rp({
      method: 'PUT',
      uri: `${config.organisations.service.url}/organisations/${organisationId}/services/${serviceId}/invitations/${invitationId}`,
      headers: {
        authorization: `Bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        roleId,
      },
      json: true,
    });
  } catch (e) {
    throw e;
  }
};

module.exports = {
  getUserOrganisations,
  getInvitationOrganisations,
  getServiceById,
  getPageOfOrganisations,
  getAllOrganisations,
  getServiceIdentifierDetails,
  addInvitationService,
};
