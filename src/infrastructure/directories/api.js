const rp = require('request-promise').defaults({
  forever: true,
  keepAlive: true,
});
const jwtStrategy = require('login.dfe.jwt-strategies');
const config = require('./../config');

const getPageOfUsers = async (pageNumber, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    const pageOfUsers = await rp({
      method: 'GET',
      uri: `${config.directories.service.url}/users?page=${pageNumber}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });

    return pageOfUsers;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 401) {
      return null;
    }
    throw e;
  }
};

const getUser = async (uid, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    const user = await rp({
      method: 'GET',
      uri: `${config.directories.service.url}/users/${uid}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });

    return user;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404) {
      return null;
    }
    throw e;
  }
};

const getPageOfInvitations = async (pageNumber, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    const pageOfInvitations = await rp({
      method: 'GET',
      uri: `${config.directories.service.url}/invitations?page=${pageNumber}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });

    return pageOfInvitations;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404) {
      return null;
    }
    throw e;
  }
};

const getInvitation = async (invitationId, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    const invitation = await rp({
      method: 'GET',
      uri: `${config.directories.service.url}/invitations/${invitationId}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });

    return invitation;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404) {
      return null;
    }
    throw e;
  }
};

const getUserDevices = async (uid, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    const devices = await rp({
      method: 'GET',
      uri: `${config.directories.service.url}/users/${uid}/devices`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });

    return devices ? devices : [];
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 401) {
      return null;
    }
    throw e;
  }
};

const getUserAssociatedToDevice = async (type, serialNumber, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    const deviceAssociation = await rp({
      method: 'GET',
      uri: `${config.directories.service.url}/devices/${type}/${serialNumber}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });

    return deviceAssociation ? deviceAssociation.associatedWith : null;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404) {
      return null;
    }
    throw e;
  }
};

const updateUser = async (uid, givenName, familyName, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    const body = {};
    if (givenName) {
      body.given_name = givenName;
    }
    if (familyName) {
      body.family_name = familyName;
    }

    await rp({
      method: 'PATCH',
      uri: `${config.directories.service.url}/users/${uid}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body,
      json: true,
    });
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 401) {
      return null;
    }
    throw e;
  }
};

const deactivate = async (uid, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  await rp({
    method: 'POST',
    uri: `${config.directories.service.url}/users/${uid}/deactivate`,
    headers: {
      authorization: `bearer ${token}`,
      'x-correlation-id': correlationId,
    },
    json: true,
  });
};

const reactivate = async (uid, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  await rp({
    method: 'POST',
    uri: `${config.directories.service.url}/users/${uid}/activate`,
    headers: {
      authorization: `bearer ${token}`,
      'x-correlation-id': correlationId,
    },
    json: true,
  });
};

const createInvite = async (givenName, familyName, email, k2sId, digipassSerialNumber, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  const invitation = await rp({
    method: 'POST',
    uri: `${config.directories.service.url}/invitations`,
    headers: {
      authorization: `bearer ${token}`,
      'x-correlation-id': correlationId,
    },
    body: {
      firstName: givenName,
      lastName: familyName,
      email,
      keyToSuccessId: k2sId,
      tokenSerialNumber: digipassSerialNumber,
      source: 'support',
    },
    json: true,
  });

  return invitation.id;
};

const createUserDevice = async (id, serialNumber, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();
  try {
    const opts = {
      method : 'POST',
      uri: `${config.directories.service.url}/users/${id}/devices`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    };

      opts.body = { type: 'digipass', serialNumber };

    await rp(opts);

    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      statusCode: e.statusCode,
      errorMessage: e.message,
    };
  }
};

const deleteUserDevice = async (id, serialNumber, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();
  try {
    const opts = {
      method : 'DELETE',
      uri: `${config.directories.service.url}/users/${id}/devices`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    };

    opts.body = { type: 'digipass', serialNumber };

    await rp(opts);

    return {
      success: true
    };
  } catch (e) {
    return {
      success: false,
      statusCode: e.statusCode,
      errorMessage: e.message,
    };
  }
};

module.exports = {
  getPageOfUsers,
  getUser,
  getPageOfInvitations,
  getInvitation,
  getUserDevices,
  getUserAssociatedToDevice,
  updateUser,
  deactivate,
  reactivate,
  createInvite,
  createUserDevice,
  deleteUserDevice
};
