const { api } = require('./../../infrastructure/audit');

const postUpdateAuditLog = async (req, res) => {
  await api.updateAuditLogs();
  res.redirect(`/users/${req.params.uid}/audit`);
};

module.exports = postUpdateAuditLog;
