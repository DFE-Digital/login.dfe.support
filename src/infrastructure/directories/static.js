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

module.exports = {
  reactivate,
  createInvite,
  updateInvite,
  deactivateInvite,
  reactivateInvite,
};
