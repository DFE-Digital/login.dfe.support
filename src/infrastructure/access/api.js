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

const addInvitationService = async (invitationId, serviceId, organisationId, externalIdentifiers = [], correlationId) => {
  const token = await jwtStrategy(config.access.service).getBearerToken();

  try {
    await rp({
      method: 'PUT',
      uri: `${config.access.service.url}/invitations/${invitationId}/services/${serviceId}/organisations/${organisationId}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: {
        externalIdentifiers,
      },
      json: true,
    });

    return true;
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 403) {
      return false;
    }
    throw e;
  }
};

module.exports = {
  addInvitationService,
};
