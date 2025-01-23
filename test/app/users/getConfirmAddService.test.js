jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);

jest.mock("./../../../src/infrastructure/access", () => {
  return {
    listRolesOfService: jest.fn(),
    addInvitationService: jest.fn(),
    addUserService: jest.fn(),
  };
});
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("./../../../src/infrastructure/applications", () => {
  return {
    getAllServices: jest.fn(),
  };
});

const { getRequestMock, getResponseMock } = require("./../../utils");
const {
  getAllServices,
} = require("./../../../src/infrastructure/applications");
const { listRolesOfService } = require("./../../../src/infrastructure/access");
const {
  getUserOrganisations,
  getInvitationOrganisations,
} = require("./../../../src/infrastructure/organisations");
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

    listRolesOfService.mockReset();
    listRolesOfService.mockReturnValue([
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

    expect(listRolesOfService.mock.calls).toHaveLength(1);
    expect(listRolesOfService.mock.calls[0][0]).toBe("service1");
    expect(listRolesOfService.mock.calls[0][1]).toBe("correlationId");
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

  it("then it should include the organisation details for a invitation if request of invitation", async () => {
    req.params.uid = "inv-invitation1";
    await getConfirmAddService(req, res);
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
