const getUserOrganisations = async () => {
  return Promise.resolve([
    {
      id: "83f00ace-f1a0-4338-8784-fa14f5943e5a",
      name: "Some service",
      description: "Some service that does some stuff",
      status: 1,
      userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
      requestDate: "2018-01-18T10:46:59.385Z",
      approvers: [],
      organisation: {
        id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        name: "Big School",
      },
      role: {
        id: 0,
        name: "End user",
      },
    },
  ]);
};

const getUserOrganisationsV2 = async () => {
  return Promise.resolve([
    {
      id: "83f00ace-f1a0-4338-8784-fa14f5943e5a",
      name: "Some service",
      description: "Some service that does some stuff",
      status: 1,
      userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
      requestDate: "2018-01-18T10:46:59.385Z",
      approvers: [],
      organisation: {
        id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        name: "Big School",
      },
      role: {
        id: 0,
        name: "End user",
      },
    },
  ]);
};

const getInvitationOrganisations = async (invitationId) => {
  return Promise.resolve([
    {
      invitationId: invitationId,
      role: {
        id: 0,
        name: "End user",
      },
      service: {
        id: "3bfde961-f061-4786-b618-618deaf96e44",
        name: "Key to success (KtS)",
      },
      organisation: {
        id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        name: "Big School",
      },
    },
  ]);
};

const getServiceById = async () => {
  return Promise.resolve({
    id: "83f00ace-f1a0-4338-8784-fa14f5943e5a",
    name: "Some service",
    description: "Some service that does some stuff",
  });
};

const getAllServices = async () => {
  return Promise.resolve([
    {
      id: "83f00ace-f1a0-4338-8784-fa14f5943e5a",
      name: "Some service",
      description: "Some service that does some stuff",
    },
  ]);
};

const getOrganisationById = async () => {
  return Promise.resolve(undefined);
};

const addInvitationService = async () => {
  return Promise.resolve(null);
};

const addInvitationOrganisation = async () => {
  return Promise.resolve(null);
};

const getServicesByUserId = async () => {
  return Promise.resolve(null);
};

const putSingleServiceIdentifierForUser = async () => {
  return Promise.resolve(null);
};

const searchOrganisations = async () => {
  return Promise.resolve(null);
};

const setUserAccessToOrganisation = async () => {
  return Promise.resolve(null);
};

const getOrganisationCategories = async () => {
  return Promise.resolve([]);
};

const getOrganisationUsersForApproval = async () => {
  return Promise.resolve([]);
};

const listUserServices = async () => {
  return Promise.resolve([]);
};

const listInvitationServices = async () => {
  return Promise.resolve([]);
};

const getAllRequestsForSupport = async () => {
  return Promise.resolve();
};

const getRequestById = async () => {
  return Promise.resolve();
};

const updateRequestById = async () => {
  return Promise.resolve();
};

const putUserInOrganisation = async () => {
  return Promise.resolve();
};

const getPendingRequestsAssociatedWithUser = async () => {
  return Promise.resolve();
};

const createOrganisation = async () => {
  return Promise.resolve();
};

const getCategories = async () => {
  return await getCategories();
};

module.exports = {
  createOrganisation,
  getUserOrganisations,
  getInvitationOrganisations,
  getServiceById,
  getAllServices,
  getOrganisationById,
  addInvitationService,
  addInvitationOrganisation,
  getServicesByUserId,
  putSingleServiceIdentifierForUser,
  searchOrganisations,
  setUserAccessToOrganisation,
  getOrganisationCategories,
  getOrganisationUsersForApproval,
  listUserServices,
  listInvitationServices,
  getUserOrganisationsV2,
  getAllRequestsForSupport,
  getRequestById,
  updateRequestById,
  putUserInOrganisation,
  getPendingRequestsAssociatedWithUser,
  getCategories,
};
