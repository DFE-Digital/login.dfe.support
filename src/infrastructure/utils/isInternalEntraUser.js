// Check if the user is an internal DSI user and has migrated to Entra
const isInternalEntraUser = (user) => {
  return !!(user?.isInternalUser && user?.isEntra && user?.entraOid);
};

module.exports = isInternalEntraUser;
