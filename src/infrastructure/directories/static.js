const { v4: uuid } = require("uuid");

const getUser = async () => {
  return {
    sub: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
    given_name: "Test",
    family_name: "Tester",
    email: "test@localuser.com",
    password:
      "0dqy81MVA9lqs2+xinvOXbbGMhd18X4pq5aRfiE65pIKxcWB0OtAffY9NdJy0/ksjhBG9EOYywti2WYmtqwxypRil+x0/nBeBlJUfN7/Q9l8tRiDcqq8NghC8wqSEuyzLKXoE/+VDPkW35Vo8czsOp5PT0xN3IQ31vlld/4PqsqQWYE4WBTBO/PO6SoAfNapDxb4M9C8TiReek43pfVL3wTst8Bv4wkeFcLy7NMGVyM48LmjlyvYPIY5NTz8RGOSCAyB7kIxYEsf9SB0Sp0IMGhHIoM8/Yhso3cJNTKTLod0Uz3Htc0JAStugt6RCrnar3Yc7yUzSGDNZcvM31HsP74i5TifaJiavHOiZxjaHYn/KsLFi5/zqNRcYkzN+dYzWY1hjCSY47za9HMh89ZHxGkmrknQY4YKRp/uvg2driXwZDaIm7NUt90mXim4PGM0kYejp9SUwlIGmc5F4QO5F3tBoRb/AYsf3f6mDw7SXAMnO/OVfglvf/x3ICE7UCLkuMXZAECe8MJoJnpP+LVrNQfJjSrjmBYrVRVkS2QFrte0g2WO1SprE9KH8kkmNEmkC6Z3orDczx5jW7LSl37ZHzq1dvMYAJrEoWH21e6ug5usMSl1X6S5uBIsSrj8kOlTYgr4huPjN54aBTVYazCn6UFVrt83E81nbuyZTadrnA4=",
    salt: "PasswordIs-password-",
  };
};

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
  getUser,
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
