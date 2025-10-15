jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/invitations");
jest.mock("login.dfe.api-client/services");
jest.mock("login.dfe.api-client/users");

jest.mock("./../../../src/infrastructure/organisations");
jest.mock("../../../src/app/services/utils", () => ({
  getAllServices: jest.fn(),
}));

const { getRequestMock, getResponseMock } = require("./../../utils");
const { getServiceRolesRaw } = require("login.dfe.api-client/services");
const { getAllServices } = require("../../../src/app/services/utils");
const {
  getInvitationOrganisationsRaw,
} = require("login.dfe.api-client/invitations");
const {
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");
const res = getResponseMock();

describe("when displaying the confirm add service view", () => {
  let req;
  let getConfirmAddService;

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

    getServiceRolesRaw.mockReset();
    getServiceRolesRaw.mockReturnValue([
      {
        code: "role_code",
        id: "role_id",
        name: "role_name",
        status: {
          id: "status_id",
        },
      },
    ]);
    getAllServices.mockReset();
    getAllServices.mockReturnValue({
      services: [
        {
          id: "service1",
          dateActivated: "10/10/2018",
          name: "service name",
          status: "active",
          isExternalService: true,
        },
      ],
    });

    getConfirmAddService =
      require("./../../../src/app/users/confirmAddService").get;
  });

  it("then it should get all services", async () => {
    await getConfirmAddService(req, res);

    expect(getAllServices.mock.calls).toHaveLength(1);
    expect(getAllServices.mock.calls[0][0]).toBe("correlationId");
  });

  it("then it should list all roles of service", async () => {
    await getConfirmAddService(req, res);

    expect(getServiceRolesRaw.mock.calls).toHaveLength(1);
    expect(getServiceRolesRaw).toHaveBeenCalledWith({ serviceId: "service1" });
  });

  it("then it should return the confirm add service view", async () => {
    await getConfirmAddService(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/confirmAddService");
  });

  it("then it should include csrf token", async () => {
    await getConfirmAddService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should include the organisation details for a user if request of user", async () => {
    await getConfirmAddService(req, res);
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
    await getConfirmAddService(req, res);
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

  it("then it should include the users details", async () => {
    await getConfirmAddService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: {
        firstName: "test",
        lastName: "name",
        email: "test@test.com",
      },
    });
  });

  it("then it should include the service details", async () => {
    await getConfirmAddService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      services: [
        {
          id: "service1",
          name: "service name",
          roles: [],
        },
      ],
    });
  });
});
