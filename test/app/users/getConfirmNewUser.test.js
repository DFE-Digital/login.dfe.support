jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("../../../src/app/services/utils", () => ({
  getAllServices: jest.fn(),
}));

const { getRequestMock, getResponseMock } = require("./../../utils");
const { getAllServices } = require("../../../src/app/services/utils");
const getConfirmNewUser = require("./../../../src/app/users/getConfirmNewUser");

describe("when getting the confirm new user page", () => {
  let req;
  let res;

  beforeEach(() => {
    req = getRequestMock({
      session: {
        user: {
          firstName: "Test",
          lastName: "User",
          email: "test.user@example.com",
          organisationId: "org1",
          organisationName: "Test Org",
          permission: 0,
        },
      },
    });

    res = getResponseMock();

    getAllServices.mockReset();
    getAllServices.mockReturnValue({
      services: [
        {
          id: "service-visible",
          name: "Visible Service",
          isExternalService: true,
          isHiddenForSupport: false,
        },
        {
          id: "service-hidden",
          name: "Hidden Service",
          isExternalService: true,
          isHiddenForSupport: true,
        },
        {
          id: "service-internal",
          name: "Internal Service",
          isExternalService: false,
          isHiddenForSupport: false,
        },
      ],
    });
  });

  it("should render the confirmNewUser view", async () => {
    await getConfirmNewUser(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/confirmNewUser");
  });

  it("should include csrf token", async () => {
    await getConfirmNewUser(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("should exclude services with isHiddenForSupport: true from oidcClients", async () => {
    await getConfirmNewUser(req, res);

    const oidcClients = res.render.mock.calls[0][1].oidcClients;
    expect(oidcClients.map((s) => s.id)).not.toContain("service-hidden");
  });

  it("should include services with isHiddenForSupport: false in oidcClients", async () => {
    await getConfirmNewUser(req, res);

    const oidcClients = res.render.mock.calls[0][1].oidcClients;
    expect(oidcClients.map((s) => s.id)).toContain("service-visible");
  });

  it("should exclude services with isExternalService: false from oidcClients even if isHiddenForSupport is false", async () => {
    await getConfirmNewUser(req, res);

    const oidcClients = res.render.mock.calls[0][1].oidcClients;
    expect(oidcClients.map((s) => s.id)).not.toContain("service-internal");
  });

  it("should include user details from session", async () => {
    await getConfirmNewUser(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      user: {
        firstName: "Test",
        lastName: "User",
        email: "test.user@example.com",
      },
    });
  });

  it("should include organisation from session if organisationId is set", async () => {
    await getConfirmNewUser(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      organisation: {
        id: "org1",
        name: "Test Org",
      },
    });
  });
});
