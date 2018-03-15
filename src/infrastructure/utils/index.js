const isLoggedIn = require('./isLoggedIn');
const setCurrentArea = require('./setCurrentArea');
const sendResult = require('./sendResult');
const mapUserStatus = require('./mapUserStatus');
const auditDateFixer = require('./auditDateFixer');
const auditSorter = require('./auditSorter');
const patchChangeHistory = require('./patchChangeHistory');

module.exports = {
  isLoggedIn,
  setCurrentArea,
  sendResult,
  mapUserStatus,
  auditDateFixer,
  auditSorter,
  patchChangeHistory,
};
