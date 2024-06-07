const config = require('./../config');
const { fetchApi } = require('login.dfe.async-retry');
const asyncRetry = require('login.dfe.async-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');


const getDevices = async (correlationId) => {
  const token = await jwtStrategy(config.devices.service).getBearerToken();

  try {
    const devices = await fetchApi(`${config.devices.service.url}/digipass`,{
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
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

    const resp = await asyncRetry(async () =>{
      const response = await fetch(`${config.devices.service.url}/digipass/${serialNumber}`,{
        method: 'GET',
        headers: {
          authorization: `bearer ${token}`,
          'x-correlation-id': correlationId,
        }
      });

      return response;
    }, asyncRetry.strategies.apiStrategy);
    
    if (resp.status === 204) {
      return true;
    }    
    if (resp.status === 404) {
      return false;
    }

    throw new Error(`Error calling api, status code ${response.status}`);

  } catch (e) {
    const status = e.status ? e.status : 500;
    if (status === 404) {
      return false;
    }
    throw e;
  }
};

const syncDigipassToken = async (serialNumber, code1, code2) => {
  const token = await jwtStrategy(config.devices.service).getBearerToken();

  try {
    const response = await fetchApi(`${config.devices.service.url}/digipass/${serialNumber}/sync`,{
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {
        code1,
        code2,
      }
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

const getDeviceUnlockCode = async (serialNumber, code, correlationId) => {
  const token = await jwtStrategy(config.devices.service).getBearerToken();

  try {
    const device = await fetchApi(`${config.devices.service.url}/digipass/${serialNumber}?fields=${code}`,{
      method: 'GET',
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      }
    });

    return Object.values(Object.keys(device)
      .filter(key => code === key)
      .reduce((obj, key) => {
        obj[key] = device[key];
        return obj;
      }, {}))[0] || undefined;
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
    await fetchApi(`${config.devices.service.url}/digipass/${serialNumber}/deactivate`,{
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        reason: reason,
      }
    });

    return true;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 401) {
      return null;
    }
    if (status === 404) {
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
