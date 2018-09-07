const { syncFullUsersView, syncDiffUsersView } = require('./syncUsersView');
const syncUserDevicesView = require('./syncUserDevicesView');
const syncAuditCache = require('./syncAuditCache');
const syncAccessRequestsView = require('./syncAccessRequestsView');

module.exports = {
  syncFullUsersView,
  syncDiffUsersView,
  syncUserDevicesView,
  syncAuditCache,
  syncAccessRequestsView,
};
