const { v4: uuid } = require("uuid");

const reactivate = async () => {
  return Promise.resolve();
};

const createInvite = async () => {
  return Promise.resolve(uuid());
};

const updateInvite = async () => {
  return Promise.resolve(null);
};

const deactivateInvite = async () => {
  return Promise.resolve(uuid());
};

const reactivateInvite = async () => {
  return Promise.resolve(uuid());
};

const getUsersByIdV2 = async () => {
  return Promise.resolve([]);
};

const getUserStatus = async () => {
  return Promise.resolve({});
};

const getLegacyUsernames = async () => {
  return Promise.resolve([]);
};

module.exports = {
  reactivate,
  createInvite,
  updateInvite,
  deactivateInvite,
  reactivateInvite,
  getUsersByIdV2,
  getUserStatus,
  getLegacyUsernames,
};
