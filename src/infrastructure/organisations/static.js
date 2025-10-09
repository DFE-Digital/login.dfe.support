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

const getAllRequestsForSupport = async () => {
  return Promise.resolve();
};

const getRequestById = async () => {
  return Promise.resolve();
};

const putUserInOrganisation = async () => {
  return Promise.resolve();
};

const getPendingRequestsAssociatedWithUser = async () => {
  return Promise.resolve();
};

module.exports = {
  getUserOrganisationsV2,
  getAllRequestsForSupport,
  getRequestById,
  putUserInOrganisation,
  getPendingRequestsAssociatedWithUser,
};
