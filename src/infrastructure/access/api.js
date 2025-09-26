const config = require("./../config");
const jwtStrategy = require("login.dfe.jwt-strategies");
const { fetchApi } = require("login.dfe.async-retry");

const putSingleServiceIdentifierForUser = async (
  userId,
  serviceId,
  orgId,
  key,
  value,
  correlationId,
) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    await fetchApi(
      `${config.access.service.url}/users/${userId}/services/${serviceId}/organisations/${orgId}/identifiers/${key}`,
      {
        method: "PUT",
        headers: {
          authorization: `bearer ${token}`,
          "x-correlation-id": correlationId,
        },
        body: {
          value: value,
        },
      },
    );
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

const removeServiceFromUser = async (
  userId,
  serviceId,
  organisationId,
  correlationId,
) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  return await fetchApi(
    `${config.access.service.url}/users/${userId}/services/${serviceId}/organisations/${organisationId}`,
    {
      method: "DELETE",
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
    },
  );
};

const removeServiceFromInvitation = async (
  invitationId,
  serviceId,
  organisationId,
  correlationId,
) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  return await fetchApi(
    `${config.access.service.url}/invitations/${invitationId}/services/${serviceId}/organisations/${organisationId}`,
    {
      method: "DELETE",
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
    },
  );
};

const getUserServiceRequestsByUserId = async (id, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    return await fetchApi(
      `${config.access.service.url}/users/${id}/service-requests`,
      {
        method: "GET",
        headers: {
          authorization: `bearer ${token}`,
          "x-correlation-id": correlationId,
        },
      },
    );
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const updateUserServiceRequest = async (id, requestBody, correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  return await fetchApi(
    `${config.access.service.url}/services/requests/${id}`,
    {
      method: "PATCH",
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
      body: requestBody,
    },
  );
};

module.exports = {
  putSingleServiceIdentifierForUser,
  removeServiceFromUser,
  removeServiceFromInvitation,
  getUserServiceRequestsByUserId,
  updateUserServiceRequest,
};
