jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);

jest.mock("./../../../src/infrastructure/organisations");

jest.mock("login.dfe.api-client/services", () => {
  return {
    getServiceRaw: jest.fn(),
  };
});

const { getRequestMock, getResponseMock } = require("./../../utils");
const { getServiceRaw } = require("login.dfe.api-client/services");
const {
  getUserOrganisations,
  getInvitationOrganisations,
} = require("./../../../src/infrastructure/organisations");
const res = getResponseMock();

describe("when displaying the remove service access view", () => {
  let req;
  let getRemoveService;

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

    getServiceRaw.mockReset();
    getServiceRaw.mockReturnValue({
      id: "service1",
      dateActivated: "10/10/2018",
      name: "service name",
      status: "active",
      isExternalService: true,
    });

    getRemoveService =
      require("./../../../src/app/users/removeServiceAccess").get;
  });

  it("then it should get the selected service details", async () => {
    await getRemoveService(req, res);

    expect(getServiceRaw).toHaveBeenCalledTimes(1);
    expect(getServiceRaw).toHaveBeenCalledWith({
      by: { serviceId: "service1" },
    });
  });

  it("then it should return the confirm remove service view", async () => {
    await getRemoveService(req, res);

    expect(res.render.mock.calls.length).toBe(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/removeService");
  });

  it("then it should include the organisation details for a user if request of user", async () => {
    await getRemoveService(req, res);
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
    await getRemoveService(req, res);
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

  it("then it should include csrf token", async () => {
    await getRemoveService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should include the service details", async () => {
    await getRemoveService(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      service: {
        id: "service1",
        dateActivated: "10/10/2018",
        name: "service name",
        status: "active",
        isExternalService: true,
      },
    });
  });

  it("then it should redirect to user details if no user in session", async () => {
    req.session.user = undefined;
    await getRemoveService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      `/users/${req.params.uid}/organisations`,
    );
  });
});
