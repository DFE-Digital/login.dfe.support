jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.policy-engine");
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("./../../../src/infrastructure/applications", () => {
  return {
    getAllServices: jest.fn(),
  };
});
jest.mock("./../../../src/app/users/utils");

const { getRequestMock, getResponseMock } = require("./../../utils");
const PolicyEngine = require("login.dfe.policy-engine");
const {
  getUserOrganisations,
} = require("./../../../src/infrastructure/organisations");
const {
  getAllServices,
} = require("./../../../src/infrastructure/applications");
const {
  getAllServicesForUserInOrg,
} = require("./../../../src/app/users/utils");

const policyEngine = {
  getPolicyApplicationResultsForUser: jest.fn(),
  validate: jest.fn(),
};
const res = getResponseMock();

describe("when adding services to a user", () => {
  let req;
  let postAssociateServices;

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
    postAssociateServices =
      require("./../../../src/app/users/associateServices").post;
  });

  it("then it should render view if a service is not selected", async () => {
    req.body.selectedServices = undefined;

    await postAssociateServices(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/associateServices");
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      layout: "sharedViews/layout.ejs",
      name: "test name",
      backLink: "/users/user1/select-organisation",
      organisationDetails: {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
      },
      selectedServices: [],
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
      user: {
        email: "test@test.com",
        firstName: "test",
        lastName: "name",
      },
      validationMessages: {
        services: "At least one service must be selected",
      },
    });
  });

  it("then it should render view if a service selected that is no longer available", async () => {
    req.body.service = ["service1"];
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
        {
          id: "service3",
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
    policyEngine.getPolicyApplicationResultsForUser.mockImplementation(
      (userId, organisationId, serviceId) => ({
        policiesAppliedForUser: [],
        rolesAvailableToUser: [],
        serviceAvailableToUser: serviceId === "service3",
      }),
    );

    await postAssociateServices(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/associateServices");
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      layout: "sharedViews/layout.ejs",
      name: "test name",
      backLink: "/users/user1/select-organisation",
      organisationDetails: {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
      },
      selectedServices: ["service1"],
      services: [
        {
          id: "service3",
          dateActivated: "10/10/2018",
          name: "service name",
          status: "active",
          isExternalService: true,
          relyingParty: {
            params: {},
          },
        },
      ],
      user: {
        email: "test@test.com",
        firstName: "test",
        lastName: "name",
      },
      validationMessages: {
        services: "A service was selected that is no longer available",
      },
    });
  });

  it("then it should redirect to associate roles if at least one service selected", async () => {
    req.body.service = ["service1"];
    await postAssociateServices(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `${req.params.orgId}/services/${req.session.user.services[0].serviceId}`,
    );
  });

  it("then it should redirect to user details if no user in session", async () => {
    req.session.user = undefined;

    await postAssociateServices(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/users/${req.params.uid}/organisations`,
    );
  });
});
