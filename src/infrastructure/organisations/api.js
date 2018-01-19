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

module.exports = {
  getUserOrganisations,
};
