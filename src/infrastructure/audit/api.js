const rp = require('login.dfe.request-promise-retry');

const updateAuditLogs = async () => {
  try {
    await rp({
      method: 'POST',
      uri: `${process.env.AUDIT_HTTP_TRIGGER_URL}`,
      json: true,
    });

    return true;
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
