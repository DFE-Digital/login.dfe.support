const jwtStrategy = require("login.dfe.jwt-strategies");
const config = require("./../config");
const { fetchApi } = require("login.dfe.async-retry");

const callOrganisationsApi = async (endpoint, method, body, correlationId) => {
  const token = await jwtStrategy(
    config.organisations.service,
  ).getBearerToken();

  try {
    return await fetchApi(`${config.organisations.service.url}/${endpoint}`, {
      method,
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
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

const getUserOrganisationsV2 = async (userId, correlationId) => {
  return await callOrganisationsApi(
    `organisations/v2/associated-with-user/${userId}`,
    "GET",
    undefined,
    correlationId,
  );
};

const deleteInvitationOrganisation = async (
  invitationId,
  organisationId,
  correlationId,
) => {
  return callOrganisationsApi(
    `organisations/${organisationId}/invitations/${invitationId}`,
    "DELETE",
    undefined,
    correlationId,
  );
};

const listRequests = async (page, filterStates, correlationId) => {
  let uri = `organisations/requests?page=${page}`;
  if (filterStates && filterStates.length > 0) {
    filterStates.forEach((status) => {
      uri += `&filterstatus=${status}`;
    });
  } else {
    uri += "&filterstatus=0&filterstatus=2&filterstatus=3";
  }
  return callOrganisationsApi(uri, "GET", undefined, correlationId);
};

const getRequestById = async (requestId, correlationId) => {
  return callOrganisationsApi(
    `organisations/requests/${requestId}`,
    "GET",
    undefined,
    correlationId,
  );
};

module.exports = {
  deleteInvitationOrganisation,
  getUserOrganisationsV2,
  listRequests,
  getRequestById,
};
