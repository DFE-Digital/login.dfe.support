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

const getOidcClientById = async (id) => {
  if (!id) {
    return undefined;
  }
  const token = await jwtStrategy(config.hotConfig.service).getBearerToken();
  try {
    const client = await rp({
      method: 'GET',
      uri: `${config.hotConfig.service.url}/oidcclients/${id}`,
      headers: {
        authorization: `bearer ${token}`,
      },
      json: true,
    });
    return client;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const getAllOidcClients = async () => {
  const token = await jwtStrategy(config.hotConfig.service).getBearerToken();
  try {
    const client = await rp({
      method: 'GET',
      uri: `${config.hotConfig.service.url}/oidcclients`,
      headers: {
        authorization: `bearer ${token}`,
      },
      json: true,
    });
    return client;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

module.exports = {
  getOidcClientById,
  getAllOidcClients
};