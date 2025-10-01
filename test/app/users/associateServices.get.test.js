jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.policy-engine");
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("../../../src/app/services/utils", () => {
  return {
    getAllServices: jest.fn(),
  };
});
jest.mock("./../../../src/app/users/utils");

const { getRequestMock, getResponseMock } = require("./../../utils");
const PolicyEngine = require("login.dfe.policy-engine");
const {
  getUserOrganisations,
  getInvitationOrganisations,
} = require("./../../../src/infrastructure/organisations");
const { getAllServices } = require("../../../src/app/services/utils");
const {
  getAllServicesForUserInOrg,
} = require("./../../../src/app/users/utils");

const policyEngine = {
  getPolicyApplicationResultsForUser: jest.fn(),
  validate: jest.fn(),
};
const res = getResponseMock();

describe("when displaying the associate service view", () => {
  let req;
  let getAssociateServices;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: "user1",
        orgId: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
      },
      session: {
        user: {
          email: "test@test.com",
          firstName: "test",
          lastName: "name",
        },
      },
    });
    res.mockResetAll();

    policyEngine.getPolicyApplicationResultsForUser
      .mockReset()
      .mockReturnValue({
        policiesAppliedForUser: [],
        rolesAvailableToUser: [],
        serviceAvailableToUser: true,
      });
    PolicyEngine.mockReset().mockImplementation(() => policyEngine);

    getAllServices.mockReset();
    getAllServices.mockReturnValue({
      services: [
        {
          id: "service1",
          dateActivated: "10/10/2018",
          name: "service name",
          status: "active",
          isExternalService: true,
          relyingParty: {
            params: {},
          },
        },
      ],
    });
    getAllServicesForUserInOrg.mockReset();
    getAllServicesForUserInOrg.mockReturnValue([
      {
        id: "service2",
        dateActivated: "10/10/2018",
        name: "service name",
        status: "active",
        isExternalService: true,
      },
    ]);

    getUserOrganisations.mockReset();
    getUserOrganisations.mockReturnValue([
      {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
      },
      {
        organisation: {
          id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
          name: "Little Tiny School",
        },
      },
    ]);
    getInvitationOrganisations.mockReset();
    getInvitationOrganisations.mockReturnValue([
      {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
      },
      {
        organisation: {
          id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
          name: "Little Tiny School",
        },
      },
    ]);
    getAssociateServices =
      require("./../../../src/app/users/associateServices").get;
  });

  it("then it should return the associate services view", async () => {
    await getAssociateServices(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/associateServices");
  });

  it("then it should include csrf token", async () => {
    await getAssociateServices(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should include the organisation details for a user if request for user", async () => {
    await getAssociateServices(req, res);
    expect(getUserOrganisations.mock.calls).toHaveLength(1);
    expect(getUserOrganisations.mock.calls[0][0]).toBe("user1");
    expect(getUserOrganisations.mock.calls[0][1]).toBe("correlationId");
    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisationDetails: {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
      },
    });
  });

  it("then it should include the organisation details for a invite if request for invite", async () => {
    req.params.uid = "inv-invitation1";
    await getAssociateServices(req, res);
    expect(getInvitationOrganisations.mock.calls).toHaveLength(1);
    expect(getInvitationOrganisations.mock.calls[0][0]).toBe("invitation1");
    expect(getInvitationOrganisations.mock.calls[0][1]).toBe("correlationId");
    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisationDetails: {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
      },
    });
  });

  it("then it should include the services", async () => {
    await getAssociateServices(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      services: [
        {
          id: "service1",
          dateActivated: "10/10/2018",
          name: "service name",
          status: "active",
        },
      ],
    });
  });

  it("then it should exclude services that are not available based on policies", async () => {
    getAllServices.mockReturnValue({
      services: [
        {
          id: "service1",
          name: "service one",
          isExternalService: true,
          relyingParty: {
            params: {},
          },
        },
        {
          id: "service2",
          name: "service two",
          isExternalService: true,
          relyingParty: {
            params: {},
          },
        },
      ],
    });
    getAllServicesForUserInOrg.mockReturnValue([]);
    policyEngine.getPolicyApplicationResultsForUser.mockImplementation(
      (userId, organisationId, serviceId) => ({
        policiesAppliedForUser: [],
        rolesAvailableToUser: [],
        serviceAvailableToUser: serviceId === "service2",
      }),
    );

    await getAssociateServices(req, res);

    expect(
      policyEngine.getPolicyApplicationResultsForUser,
    ).toHaveBeenCalledTimes(2);
    expect(
      policyEngine.getPolicyApplicationResultsForUser,
    ).toHaveBeenCalledWith(
      "user1",
      "88a1ed39-5a98-43da-b66e-78e564ea72b0",
      "service1",
      req.id,
    );
    expect(
      policyEngine.getPolicyApplicationResultsForUser,
    ).toHaveBeenCalledWith(
      "user1",
      "88a1ed39-5a98-43da-b66e-78e564ea72b0",
      "service2",
      req.id,
    );
    expect(res.render.mock.calls[0][1]).toMatchObject({
      services: [
        {
          id: "service2",
          name: "service two",
          isExternalService: true,
          relyingParty: {
            params: {},
          },
        },
      ],
    });
  });
});
