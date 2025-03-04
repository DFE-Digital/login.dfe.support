const isLoggedIn = require("./isLoggedIn");
const isInternalEntraUser = require("./isInternalEntraUser");
const setCurrentArea = require("./setCurrentArea");
const sendResult = require("./sendResult");
const { mapUserStatus, userStatusMap } = require("./mapUserStatus");
const patchChangeHistory = require("./patchChangeHistory");
const isRequestApprover = require("./isRequestApprover");
const isServiceCreator = require("./isServiceCreator");

module.exports = {
  isLoggedIn,
  isInternalEntraUser,
  setCurrentArea,
  sendResult,
  mapUserStatus,
  userStatusMap,
  patchChangeHistory,
  isRequestApprover,
  isServiceCreator,
};
