const {syncFullUsersView} = require('./syncUsersView');
const syncUserDevicesView = require('./syncUserDevicesView');
const syncAuditCache = require('./syncAuditCache');
const syncAccessRequestsView = require('./syncAccessRequestsView');

module.exports = {
  syncFullUsersView,
  syncUserDevicesView,
  syncAuditCache,
  syncAccessRequestsView,
};
