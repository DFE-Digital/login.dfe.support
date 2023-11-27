const config = require('./../config');

const rp = require('login.dfe.request-promise-retry');

const wsSyncCall = async (orgId) => {
  if (!orgId) {
    return undefined;
  }
  try {
    const client = await rp({
      method: 'GET',
      uri: `${process.env.WSORG_SYNC_URL}?orgId=${orgId}`
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
  wsSyncCall
};
