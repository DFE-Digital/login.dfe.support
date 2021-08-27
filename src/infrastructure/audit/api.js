const config = require('./../config');
const rp = require('login.dfe.request-promise-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');

const updateAuditLogs = async () => {
  const token = await jwtStrategy(config.directories.service).getBearerToken();

  try {
    await rp({
      method: 'POST',
      uri: `${config.audit.service.url}/`,
      headers: {
        authorization: `bearer ${token}`,
      },
      json: true,
    });
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404) {
      return null;
    }
    throw e;
  }
};

module.exports = {
  updateAuditLogs,
};
