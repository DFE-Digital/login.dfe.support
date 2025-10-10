const { v4: uuid } = require("uuid");

const createInvite = async () => {
  return Promise.resolve(uuid());
};

const updateInvite = async () => {
  return Promise.resolve(null);
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
  createInvite,
  updateInvite,
  getUsersByIdV2,
  getUserStatus,
  getLegacyUsernames,
};
