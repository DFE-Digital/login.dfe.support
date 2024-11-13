const config = require('./../config');
const jwtStrategy = require('login.dfe.jwt-strategies');
const { fetchApi } = require('login.dfe.async-retry');

const addInvitationService = async (invitationId, serviceId, organisationId, externalIdentifiers = [], roles = [], correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    return await fetchApi(`${config.access.service.url}/invitations/${invitationId}/services/${serviceId}/organisations/${organisationId}`,{
      method: 'PUT',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        identifiers: externalIdentifiers,
        roles,
      },
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

const addUserService = async (userId, serviceId, organisationId, roles = [], correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    return await fetchApi(`${config.access.service.url}/users/${userId}/services/${serviceId}/organisations/${organisationId}`, {
      method: 'PUT',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        roles,
      },
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

const updateUserService = async (userId, serviceId, organisationId, roles, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    return await fetchApi(`${config.access.service.url}/users/${userId}/services/${serviceId}/organisations/${organisationId}`, {
      method: 'PATCH',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        roles,
      },
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

const updateInvitationService = async (invitationId, serviceId, organisationId, roles, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    return await fetchApi(`${config.access.service.url}/invitations/${invitationId}/services/${serviceId}/organisations/${organisationId}`, {
      method: 'PATCH',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        roles,
      },
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

const getServicesByUserId = async (id, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    return await fetchApi(`${config.access.service.url}/users/${id}/services`,{
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const getServicesByInvitationId = async (iid, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    return await fetchApi(`${config.access.service.url}/invitations/${iid}/services`, {
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const putSingleServiceIdentifierForUser = async (userId, serviceId, orgId, key, value, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    await fetchApi(`${config.access.service.url}/users/${userId}/services/${serviceId}/organisations/${orgId}/identifiers/${key}`,{
      method: 'PUT',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        value: value
      }
    });
    return true;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    if (e.statusCode === 409) {
      return undefined;
    }
    throw e;
  }

};

const getServiceIdentifierDetails = async (serviceId, identifierKey, identifierValue, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    return await fetchApi(`${config.access.service.url}/services/${serviceId}/users?filteridkey=${identifierKey}&filteridvalue=${identifierValue}`, {
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const getSingleUserService = async (userId, serviceId, organisationId, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    return await fetchApi(`${config.access.service.url}/users/${userId}/services/${serviceId}/organisations/${organisationId}`, {
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const getSingleInvitationService = async (invitationId, serviceId, organisationId, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    return await fetchApi(`${config.access.service.url}/invitations/${invitationId}/services/${serviceId}/organisations/${organisationId}`, {
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const listRolesOfService = async (serviceId, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    return await fetchApi(`${config.access.service.url}/services/${serviceId}/roles`, {
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const removeServiceFromUser = async (userId, serviceId, organisationId, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  return await fetchApi(`${config.access.service.url}/users/${userId}/services/${serviceId}/organisations/${organisationId}`,{
    method: 'DELETE',
    headers: {
      authorization: `bearer ${token}`,
      'x-correlation-id': correlationId,
    }
  });
};

const removeServiceFromInvitation = async (invitationId, serviceId, organisationId, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  return await fetchApi(`${config.access.service.url}/invitations/${invitationId}/services/${serviceId}/organisations/${organisationId}`,{
    method: 'DELETE',
    headers: {
      authorization: `bearer ${token}`,
      'x-correlation-id': correlationId,
    }
  });
};

const getUserServiceRequestsByUserId = async (id, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    return await fetchApi(`${config.access.service.url}/users/${id}/service-requests`, {
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const updateUserServiceRequest = async (id, requestBody, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  return await fetchApi(`${config.access.service.url}/services/requests/${id}`,{
    method: 'PATCH',
    headers: {
      authorization: `bearer ${token}`,
      'x-correlation-id': correlationId,
    },
    body: requestBody,
  });
};

module.exports = {
  addInvitationService,
  getServicesByUserId,
  getServicesByInvitationId,
  putSingleServiceIdentifierForUser,
  getServiceIdentifierDetails,
  getSingleUserService,
  getSingleInvitationService,
  listRolesOfService,
  addUserService,
  updateInvitationService,
  updateUserService,
  removeServiceFromUser,
  removeServiceFromInvitation,
  getUserServiceRequestsByUserId,
  updateUserServiceRequest,
};
