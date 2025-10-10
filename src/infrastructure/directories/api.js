const config = require("./../config");
const jwtStrategy = require("login.dfe.jwt-strategies");

const { fetchApi } = require("login.dfe.async-retry");

const deactivateInvite = async (id, reason, correlationId) => {
  try {
    const token = await jwtStrategy(
      config.directories.service,
    ).getBearerToken();

    await fetchApi(
      `${config.directories.service.url}/invitations/${id.replace("inv-", "")}`,
      {
        method: "PATCH",
        headers: {
          authorization: `bearer ${token}`,
          "x-correlation-id": correlationId,
        },
        body: {
          reason: reason,
          deactivated: true,
        },
      },
    );
  } catch (e) {
    console.log(e);
  }
};

const reactivateInvite = async (id, reason, correlationId) => {
  try {
    const token = await jwtStrategy(
      config.directories.service,
    ).getBearerToken();

    await fetchApi(
      `${config.directories.service.url}/invitations/${id.replace("inv-", "")}`,
      {
        method: "PATCH",
        headers: {
          authorization: `bearer ${token}`,
          "x-correlation-id": correlationId,
        },
        body: {
          reason: reason,
          deactivated: false,
        },
      },
    );
  } catch (e) {
    console.log(e);
  }
};

const createInvite = async (
  givenName,
  familyName,
  email,
  clientId,
  redirectUri,
  correlationId,
  overrides,
  permission,
  orgName,
) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  const body = {
    firstName: givenName,
    lastName: familyName,
    email,
    origin: {
      clientId,
      redirectUri,
    },
    selfStarted: false,
    overrides,
    isApprover: permission && permission === 10000 ? true : false,
    orgName,
  };

  const invitation = await fetchApi(
    `${config.directories.service.url}/invitations`,
    {
      method: "POST",
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
      body,
    },
  );

  return invitation.id;
};

const updateInvite = async (id, body, correlationId) => {
  try {
    const token = await jwtStrategy(
      config.directories.service,
    ).getBearerToken();

    await fetchApi(`${config.directories.service.url}/invitations/${id}`, {
      method: "PATCH",
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
      body,
    });
  } catch (e) {
    console.log(e);
  }
};

const getUsersByIdV2 = async (ids, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    return await fetchApi(`${config.directories.service.url}/users/by-ids`, {
      method: "POST",
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
      body: {
        ids: ids.toString(),
      },
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return null;
    }
    throw e;
  }
};

const getUserStatus = async (id, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    return await fetchApi(
      `${config.directories.service.url}/users/${id}/status`,
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
      return null;
    }
    throw e;
  }
};

const getLegacyUsernames = async (userIds, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    return await fetchApi(
      `${config.directories.service.url}/users/${userIds}/legacy-username`,
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
      return null;
    }
    throw e;
  }
};

module.exports = {
  createInvite,
  updateInvite,
  deactivateInvite,
  reactivateInvite,
  getUsersByIdV2,
  getUserStatus,
  getLegacyUsernames,
};
