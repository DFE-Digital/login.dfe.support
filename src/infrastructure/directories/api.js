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
const jwtStrategy = require('login.dfe.jwt-strategies');


const getPageOfUsers = async (pageNumber, pageSize, includeDevices, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    let uri = `${config.directories.service.url}/users?page=${pageNumber}&pageSize=${pageSize}`;
    if (includeDevices) {
      uri += '&include=devices';
    }
    const pageOfUsers = await rp({
      method: 'GET',
      uri: uri,
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

const getPageOfInvitations = async (pageNumber, pageSize, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    const pageOfInvitations = await rp({
      method: 'GET',
      uri: `${config.directories.service.url}/invitations?page=${pageNumber}&pageSize=${pageSize}`,
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

const deactivateInvite = async (id, reason, correlationId) => {
  try {
    const token = await jwtStrategy(config.directories.service).getBearerToken();
    await rp({
      method: 'PATCH',
      uri: `${config.directories.service.url}/invitations/${id.replace('inv-', '')}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        reason: reason,
        deactivated: true,
      },
      json: true,
    });
  } catch (e) {
    console.log(e);
  }
};

const createInvite = async (givenName, familyName, email, digipassSerialNumber, clientId, redirectUri, correlationId, overrides) => {
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
  };
  if (digipassSerialNumber) {
    body.device = {
      type: 'digipass',
      serialNumber: digipassSerialNumber,
    };
  }

  const invitation = await rp({
    method: 'POST',
    uri: `${config.directories.service.url}/invitations`,
    headers: {
      authorization: `bearer ${token}`,
      'x-correlation-id': correlationId,
    },
    body,
    json: true,
  });

  return invitation.id;
};

const updateInvite = async (id, email, correlationId) => {
  try {
    const token = await jwtStrategy(config.directories.service).getBearerToken();
    await rp({
      method: 'PATCH',
      uri: `${config.directories.service.url}/invitations/${id}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        email,
      },
      json: true,
    });
  } catch (e) {
    console.log(e);
  }
};

const resendInvite = async (id, correlationId) => {
  try {
    const token = await jwtStrategy(config.directories.service).getBearerToken();
    await rp({
      method: 'POST',
      uri: `${config.directories.service.url}/invitations/${id}/resend`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

const createUserDevice = async (id, serialNumber, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();
  try {
    const opts = {
      method: 'POST',
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
      method: 'DELETE',
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

const createChangeEmailCode = async (userId, newEmailAddress, clientId, redirectUri, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();
  try {
    return await rp({
      method: 'PUT',
      uri: `${config.directories.service.url}/usercodes/upsert`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        uid: userId,
        clientId,
        redirectUri,
        codeType: 'changeemail',
        email: newEmailAddress,
        selfInvoked: false,
      },
      json: true,
    });
  } catch (e) {
    throw e;
  }
};

const getChangeEmailCode = async (userId, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();
  try {
    return await rp({
      method: 'GET',
      uri: `${config.directories.service.url}/usercodes/${userId}/changeemail`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return null;
    }
    throw e;
  }
};

const deleteChangeEmailCode = async (userId, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();
  try {
    return await rp({
      method: 'DELETE',
      uri: `${config.directories.service.url}/usercodes/${userId}/changeemail`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });
  } catch (e) {
    throw e;
  }
};

const getUsersById = async (ids, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();
  try {
    return await rp({
      method: 'GET',
      uri: `${config.directories.service.url}/users/by-ids?id=${ids.toString()}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return null;
    }
    throw e;
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
  updateInvite,
  deactivateInvite,
  createUserDevice,
  deleteUserDevice,
  createChangeEmailCode,
  getChangeEmailCode,
  deleteChangeEmailCode,
  getUsersById,
  resendInvite
};
