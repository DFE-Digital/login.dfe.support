const getUserOrganisations = async (userId) => {
  return Promise.resolve([
    {
      "id": "83f00ace-f1a0-4338-8784-fa14f5943e5a",
      "name": "Some service",
      "description": "Some service that does some stuff",
      "status": 1,
      "userId": "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
      "requestDate": "2018-01-18T10:46:59.385Z",
      "approvers": [],
      "organisation": {
        "id": "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        "name": "Big School"
      },
      "role": {
        "id": 0,
        "name": "End user"
      }
    }
  ]);
};

const getUserOrganisationsV2 = async (userId) => {
  return Promise.resolve([
    {
      "id": "83f00ace-f1a0-4338-8784-fa14f5943e5a",
      "name": "Some service",
      "description": "Some service that does some stuff",
      "status": 1,
      "userId": "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
      "requestDate": "2018-01-18T10:46:59.385Z",
      "approvers": [],
      "organisation": {
        "id": "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        "name": "Big School"
      },
      "role": {
        "id": 0,
        "name": "End user"
      }
    }
  ]);
};

const getInvitationOrganisations = async (invitationId, correlationId) => {
  return Promise.resolve([
    {
      "invitationId": invitationId,
      "role": {
        "id": 0,
        "name": "End user"
      },
      "service": {
        "id": "3bfde961-f061-4786-b618-618deaf96e44",
        "name": "Key to success (KtS)"
      },
      "organisation": {
        "id": "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        "name": "Big School"
      }
    }
  ])
};

const getServiceById = async (serviceId, correlationId) => {
  return Promise.resolve({
    "id": "83f00ace-f1a0-4338-8784-fa14f5943e5a",
    "name": "Some service",
    "description": "Some service that does some stuff",
  });
};

const getPageOfOrganisations = async (pageNumber) => {
  return Promise.resolve({
    organisations: [
      {
        "id": "83f00ace-f1a0-4338-8784-fa14f5943e5a",
        "name": "Some service",
      }
    ],
    page: pageNumber,
    totalNumberOfPages: 1,
  });
};

const getAllOrganisations = async () => {
  return (await getPageOfOrganisations(1)).organisations;
};

const getAllServices = async () => {
  return Promise.resolve([{
    "id": "83f00ace-f1a0-4338-8784-fa14f5943e5a",
    "name": "Some service",
    "description": "Some service that does some stuff",
  }]);
};

const getOrganisationById = async (id) => {
  return (await getPageOfOrganisations(1)).organisations.find(x => x.id === id);
};

const getOrganisationByIdV2 = async (id) => {
  return (await getPageOfOrganisations(1)).organisations.find(x => x.id === id);
};

const getServiceIdentifierDetails = async () => {
  return Promise.resolve(null);
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

const searchOrganisations = async (criteria, pageNumber, correlationId) => {
  return getPageOfOrganisations(pageNumber, correlationId);
};

const setUserAccessToOrganisation = async (userId, organisationId, roleId, correlationId) => {
  return Promise.resolve(null);
};

const getOrganisationCategories = async (correlationId) => {
  return Promise.resolve([]);
};

const getOrganisationUsersForApproval = async (pageNumber, correlationId) => {
  return Promise.resolve([]);
};

const listUserServices = async (page, pageSize, correlationId) => {
  return Promise.resolve([]);
};

const listInvitationServices = async (page, pageSize, correlationId) => {
  return Promise.resolve([]);
};

const getAllRequestsForSupport = async (correlationId) => {
  return Promise.resolve();
};

const getRequestById = async (requestId, correlationId) => {
  return Promise.resolve();
};

module.exports = {
  getUserOrganisations,
  getInvitationOrganisations,
  getServiceById,
  getPageOfOrganisations,
  getAllOrganisations,
  getAllServices,
  getOrganisationById,
  getOrganisationByIdV2,
  getServiceIdentifierDetails,
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
};
