const rp = require('request-promise');
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
    const pageOfUsers = await rp({
      method: 'GET',
      uri: `${config.directories.service.url}/users/${uid}`,
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

module.exports = {
  getPageOfUsers,
  getUser,
};
