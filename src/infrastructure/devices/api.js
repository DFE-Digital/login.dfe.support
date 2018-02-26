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

const deviceExists = async (serialNumber, correlationId) => {
  const token = await jwtStrategy(config.devices.service).getBearerToken();

  try {
    const response = await rp({
      method: 'GET',
      uri: `${config.devices.service.url}/digipass/${serialNumber}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      resolveWithFullResponse: true,
    });

    if (response.statusCode === 204) {
      return true;
    }
    if (response.statusCode === 404) {
      return false;
    }

    throw new Error(`Error calling api, status code ${response.statusCode}`);
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404) {
      return false;
    }
    throw e;
  }
};

const syncDigipassToken = async (serialNumber, code1, code2) => {
  const token = await jwtStrategy(config.devices.service).getBearerToken();
  try {
    const response = await rp({
      method: 'POST',
      uri: `${config.devices.service.url}/digipass/${serialNumber}/sync`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {
        code1,
        code2,
      },
      json: true,
    });

    return response.valid;
  } catch (e) {
    if (e.statusCode === 400) {
      return null;
    } else if (e.statusCode === 404) {
      return null;
    }
    throw e;
  }
};

const getDeviceUnlockCode = async (serialNumber,code, correlationId) => {
  const token = await jwtStrategy(config.devices.service).getBearerToken();

  try {
    const device = await rp({
      method: 'GET',
      uri: `${config.devices.service.url}/digipass/${serialNumber}?fields=${code}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      json: true,
    });

    return Object.values(Object.keys(device)
      .filter(key => code === key)
      .reduce((obj,key) => {
      obj[key] = device[key];
      return obj;
    },{}))[0] || undefined;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 401) {
      return null;
    }
    throw e;
  }
};

const deactivateToken = async (serialNumber, reason, correlationId) => {
  const token = await jwtStrategy(config.devices.service).getBearerToken();

  try {
    await rp({
      method: 'PUT',
      uri: `${config.devices.service.url}/digipass/${serialNumber}/deactivate`,
      headers: {
        authorization: `Bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body :{
        reason: reason,
      },
      json: true,
    });

    return true;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 401) {
      return null;
    }
    if(status === 404) {
      return false;
    }
    throw e;
  }
};

module.exports = {
  getDevices,
  deviceExists,
  syncDigipassToken,
  getDeviceUnlockCode,
  deactivateToken,
};
