const rp = require('request-promise');
const jwtStrategy = require('login.dfe.jwt-strategies');
const config = require('./../config');

const getDevices = async (correlationId) => {
  const token = await jwtStrategy(config.devices.service).getBearerToken();

  try {
    const devices = await rp({
      method: 'GET',
      uri: `${config.devices.service.url}/digipass`,
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


module.exports = {
  getDevices
};
