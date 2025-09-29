const { v4: uuid } = require("uuid");

const getPageOfInvitations = async (pageNumber) => {
  return {
    invitations: [],
    numberOfPages: 1,
    page: pageNumber,
  };
};

const getInvitation = async (invitationId) => {
  return {
    firstName: "Some",
    lastName: "User",
    email: "some.user@test.local",
    keyToSuccessId: "1234567",
    tokenSerialNumber: "12345678901",
    id: invitationId,
  };
};

const updateUser = async () => {
  return Promise.resolve();
};

const deactivate = async () => {
  return Promise.resolve();
};

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

const createChangeEmailCode = async () => {
  return Promise.resolve({});
};

const getChangeEmailCode = async () => {
  return Promise.resolve(null);
};

const deleteChangeEmailCode = async () => {
  return Promise.resolve();
};

const getUsersById = async () => {
  return Promise.resolve([]);
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
  getPageOfInvitations,
  getInvitation,
  updateUser,
  deactivate,
  reactivate,
  createInvite,
  updateInvite,
  deactivateInvite,
  reactivateInvite,
  createChangeEmailCode,
  getChangeEmailCode,
  deleteChangeEmailCode,
  getUsersById,
  getUsersByIdV2,
  getUserStatus,
  getLegacyUsernames,
};
