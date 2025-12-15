jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/invitations");
jest.mock("login.dfe.api-client/users");
jest.mock("login.dfe.policy-engine");
jest.mock("login.dfe.api-client/services", () => {
  return {
    getServiceRaw: jest.fn(),
  };
});

const { getRequestMock, getResponseMock } = require("./../../utils");
const { getServiceRaw } = require("login.dfe.api-client/services");
const {
  getInvitationServiceRaw,
  getInvitationOrganisationsRaw,
} = require("login.dfe.api-client/invitations");
const PolicyEngine = require("login.dfe.policy-engine");
const {
  getUserServiceRaw,
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");
const policyEngine = {
  getPolicyApplicationResultsForUser: jest.fn(),
};
const res = getResponseMock();

describe("when displaying the associate roles view", () => {
  let req;
  let getAssociateRoles;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: "user1",
        orgId: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        sid: "service1",
      },
      session: {
        user: {
          email: "test@test.com",
          firstName: "test",
          lastName: "name",
          services: [
            {
              serviceId: "service1",
              roles: [],
            },
          ],
          isAddService: true,
        },
      },
    });
    res.mockResetAll();

    getUserOrganisationsWithServicesRaw.mockReset();
    getUserOrganisationsWithServicesRaw.mockReturnValue([
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
    getInvitationOrganisationsRaw.mockReset();
    getInvitationOrganisationsRaw.mockReturnValue([
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

    getUserServiceRaw.mockReset();
    getUserServiceRaw.mockReturnValue({
      id: "service1",
      name: "service name",
      roles: [],
    });

    getInvitationServiceRaw.mockReset();
    getInvitationServiceRaw.mockReturnValue({
      id: "service1",
      name: "service name",
      roles: [],
    });

    getServiceRaw.mockReset();
    getServiceRaw.mockReturnValue({
      id: "service1",
      name: "service name",
    });

    policyEngine.getPolicyApplicationResultsForUser
      .mockReset()
      .mockReturnValue([
        {
          id: "service1",
          rolesAvailableToUser: [],
        },
      ]);
    PolicyEngine.mockReset().mockImplementation(() => policyEngine);

    getAssociateRoles = require("./../../../src/app/users/associateRoles").get;
  });

  it("then it should return the associate roles view", async () => {
    await getAssociateRoles(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/associateRoles");
  });

  it("then it should include csrf token", async () => {
    await getAssociateRoles(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should include the organisation details for a user if request of user", async () => {
    await getAssociateRoles(req, res);
    expect(getUserOrganisationsWithServicesRaw.mock.calls).toHaveLength(1);
    expect(getUserOrganisationsWithServicesRaw).toHaveBeenCalledWith({
      userId: "user1",
    });
    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisationDetails: {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
      },
    });
  });

  it("then it should include the organisation details for a invitation if request of invitation", async () => {
    req.params.uid = "inv-invitation1";

    await getAssociateRoles(req, res);
    expect(getInvitationOrganisationsRaw.mock.calls).toHaveLength(1);
    expect(getInvitationOrganisationsRaw).toHaveBeenCalledWith({
      invitationId: "invitation1",
    });
    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisationDetails: {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
      },
    });
  });

  it("then it should include the number of selected services", async () => {
    await getAssociateRoles(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      totalNumberOfServices: req.session.user.services.length,
    });
  });

  it("then it should include the current service", async () => {
    await getAssociateRoles(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      currentService: 1,
    });
  });

  it("then it should get the service details", async () => {
    await getAssociateRoles(req, res);
    expect(getServiceRaw).toHaveBeenCalledTimes(1);
    expect(getServiceRaw).toHaveBeenCalledWith({
      by: { serviceId: "service1" },
    });
  });

  it("then it should get current users roles if editing service", async () => {
    req.session.user.isAddService = false;
    await getAssociateRoles(req, res);
    expect(getUserServiceRaw.mock.calls).toHaveLength(1);
    expect(getUserServiceRaw).toHaveBeenCalledWith({
      organisationId: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
      serviceId: "service1",
      userId: "user1",
    });
  });

  it("then it should get current invitations roles if editing service", async () => {
    req.session.user.isAddService = false;
    req.params.uid = "inv-invitation1";
    await getAssociateRoles(req, res);
    expect(getInvitationServiceRaw).toHaveBeenCalledWith({
      invitationId: "invitation1",
      organisationId: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
      serviceId: "service1",
    });
  });
});
