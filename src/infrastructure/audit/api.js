const { fetchApi } = require('login.dfe.async-retry');

const updateAuditLogs = async () => {
  try {
    await fetchApi(process.env.AUDIT_HTTP_TRIGGER_URL, {
      method: 'POST',
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
