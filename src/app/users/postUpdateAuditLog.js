const { cache } = require('./../../infrastructure/audit');

const postUpdateAuditLog = async (req, res) => {
  await cache.changeAuditStatus();
  res.redirect(`/users/${req.params.uid}/audit`);
};

module.exports = postUpdateAuditLog;
