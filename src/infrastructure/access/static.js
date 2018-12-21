const addInvitationService = async () => {
  return Promise.resolve(null);
};

const addUserService = async () => {
  return Promise.resolve(null);
};

const getServicesByUserId = async() => {
  return Promise.resolve(null);
};

const putSingleServiceIdentifierForUser = async () => {
  return Promise.resolve(null);
};

const getServiceIdentifierDetails = async () => {
  return Promise.resolve(null);
};

const getServicesByInvitationId = async () => {
  return Promise.resolve(null);
};

const getSingleUserService = async () => {
  return Promise.resolve(null);
};

const getSingleInvitationService = async () => {
  return Promise.resolve(null);
};

const listRolesOfService = async () => {
  return Promise.resolve(null);
};

const updateUserService = async () => {
  return Promise.resolve(null);
};

const updateInvitationService = async () => {
  return Promise.resolve(null);
};

const removeServiceFromUser = async(uid, sid, oid, correlationId) => {
  return Promise.resolve();
};

const removeServiceFromInvitation = async(iid, sid, oid, correlationId) => {
  return Promise.resolve();
};


module.exports = {
  addInvitationService,
  getServicesByUserId,
  putSingleServiceIdentifierForUser,
  getServiceIdentifierDetails,
  getServicesByInvitationId,
  getSingleInvitationService,
  getSingleUserService,
  listRolesOfService,
  addUserService,
  updateUserService,
  updateInvitationService,
  removeServiceFromInvitation,
  removeServiceFromUser
};
