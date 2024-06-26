const config = require('./../config');
const jwtStrategy = require('login.dfe.jwt-strategies');

const { fetchApi } = require('login.dfe.async-retry');


const getPageOfUsers = async (pageNumber, pageSize, includeDevices, includeCodes, includeLegacyUsernames, changedAfter, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    let uri = `${config.directories.service.url}/users?page=${pageNumber}&pageSize=${pageSize}`;

    if (includeDevices || includeCodes || includeLegacyUsernames) {
      const includes = [
        includeDevices ? 'devices' : undefined,
        includeCodes ? 'codes' : undefined,
        includeLegacyUsernames ? 'legacyusernames' : undefined,
      ].filter(x => x !== undefined).join(',');
      uri += `&include=${includes}`;
    }

    if (changedAfter) {
      uri += `&changedAfter=${changedAfter.toISOString()}`;
    }

    const pageOfUsers = await fetchApi(uri,{
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      }
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
    const user = await fetchApi(`${config.directories.service.url}/users/${uid}`,{
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      }
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

const getPageOfInvitations = async (pageNumber, pageSize, changedAfter, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    let uri = `${config.directories.service.url}/invitations?page=${pageNumber}&pageSize=${pageSize}`;
    
    if (changedAfter) {
      uri += `&changedAfter=${changedAfter.toISOString()}`;
    }

    const pageOfInvitations = await fetchApi( uri,{
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      }
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
    const invitation = await fetchApi(`${config.directories.service.url}/invitations/${invitationId}`,{
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
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
    const devices = await fetchApi(`${config.directories.service.url}/users/${uid}/devices`,{
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      }
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
    const deviceAssociation = await fetchApi(`${config.directories.service.url}/devices/${type}/${serialNumber}`,{
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      }
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

    await fetchApi(`${config.directories.service.url}/users/${uid}`,{
      method: 'PATCH',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body
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

  await fetchApi(`${config.directories.service.url}/users/${uid}/deactivate`,{
    method: 'POST',
    headers: {
      authorization: `bearer ${token}`,
      'x-correlation-id': correlationId,
    }
  });
};

const reactivate = async (uid, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  await fetchApi(`${config.directories.service.url}/users/${uid}/activate`,{
    method: 'POST',
    headers: {
      authorization: `bearer ${token}`,
      'x-correlation-id': correlationId,
    }
  });
};

const deactivateInvite = async (id, reason, correlationId) => {
  try {
    const token = await jwtStrategy(config.directories.service).getBearerToken();

    await fetchApi(`${config.directories.service.url}/invitations/${id.replace('inv-', '')}`,{
      method: 'PATCH',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        reason: reason,
        deactivated: true,
      }
    });
  } catch (e) {
    console.log(e);
  }
};

const reactivateInvite = async (id, reason, correlationId) => {
  try {
    const token = await jwtStrategy(config.directories.service).getBearerToken();

    await fetchApi(`${config.directories.service.url}/invitations/${id.replace('inv-', '')}`,{
      method: 'PATCH',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        reason: reason,
        deactivated: false,
      }
    });
  } catch (e) {
    console.log(e);
  }
};

const createInvite = async (givenName, familyName, email, digipassSerialNumber, clientId, redirectUri, correlationId, overrides, permission, orgName) => {
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
    isApprover: (permission && permission === 10000) ? true : false,
    orgName,
  };
  if (digipassSerialNumber) {
    body.device = {
      type: 'digipass',
      serialNumber: digipassSerialNumber,
    };
  }

  const invitation = await fetchApi(`${config.directories.service.url}/invitations`,{
    method: 'POST',
    headers: {
      authorization: `bearer ${token}`,
      'x-correlation-id': correlationId,
    },
    body
  });

  return invitation.id;
};

const updateInvite = async (id, email, correlationId) => {
  try {
    const token = await jwtStrategy(config.directories.service).getBearerToken();

    await fetchApi(`${config.directories.service.url}/invitations/${id}`,{
      method: 'PATCH',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        email,
      }
    });
  } catch (e) {
    console.log(e);
  }
};

const resendInvite = async (id, correlationId) => {
  try {
    const token = await jwtStrategy(config.directories.service).getBearerToken();
    
    await fetchApi(`${config.directories.service.url}/invitations/${id}/resend`,{
      method: 'POST',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      }
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
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    };

    opts.body = { type: 'digipass', serialNumber };

    await fetchApi(`${config.directories.service.url}/users/${id}/devices`,opts);

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
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
    };

    opts.body = { type: 'digipass', serialNumber };

    await fetchApi(`${config.directories.service.url}/users/${id}/devices`,opts);

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
    return await fetchApi(`${config.directories.service.url}/usercodes/upsert`,{
      method: 'PUT',
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
      }
    });
  } catch (e) {
    throw e;
  }
};

const getChangeEmailCode = async (userId, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    return await fetchApi(`${config.directories.service.url}/usercodes/${userId}/changeemail`,{
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
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
    return await fetchApi(`${config.directories.service.url}/usercodes/${userId}/changeemail`,{
      method: 'DELETE',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      }
    });
  } catch (e) {
    throw e;
  }
};

const getUsersById = async (ids, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    return await fetchApi(`${config.directories.service.url}/users/by-ids?id=${ids.toString()}`,{
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return null;
    }
    throw e;
  }
};

const getUsersByIdV2 = async (ids, correlationId) => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    return await fetchApi(`${config.directories.service.url}/users/by-ids`,{
      method: 'POST',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        ids: ids.toString(),
      }
    });
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
    return await fetchApi(`${config.directories.service.url}/users/${userIds}/legacy-username`,{
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      }
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
  reactivateInvite,
  createUserDevice,
  deleteUserDevice,
  createChangeEmailCode,
  getChangeEmailCode,
  deleteChangeEmailCode,
  getUsersById,
  resendInvite,
  getLegacyUsernames,
  getUsersByIdV2,
};
