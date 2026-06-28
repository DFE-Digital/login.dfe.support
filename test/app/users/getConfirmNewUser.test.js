jest.mock("../../../src/app/services/utils", () => ({
  getAllServices: jest.fn(),
}));

const getConfirmNewUser = require("../../../src/app/users/getConfirmNewUser");
const { getAllServices } = require("../../../src/app/services/utils");

describe("When confirming a new user", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      csrfToken: () => "token",
      session: {
        user: {
          firstName: "Test",
          lastName: "User",
          email: "test.user@unit.test",
          organisationId: "org1",
          organisationName: "Test Org",
          permission: 0,
        },
      },
    };
    res = {
      render: jest.fn(),
    };

    getAllServices.mockReset();
  });

  it("should exclude a fully hidden role-based service from oidcClients", async () => {
    getAllServices.mockReturnValue({
      services: [
        {
          id: "visible-service",
          name: "Visible Service",
          isIdOnlyService: false,
          relyingParty: { params: {} },
        },
        {
          id: "hidden-service",
          name: "Hidden Role-Based Service",
          isIdOnlyService: false,
          relyingParty: { params: { hideSupport: "true" } },
        },
      ],
    });

    await getConfirmNewUser(req, res);

    const oidcClientIds = res.render.mock.calls[0][1].oidcClients.map(
      (s) => s.id,
    );
    expect(oidcClientIds).toContain("visible-service");
    expect(oidcClientIds).not.toContain("hidden-service");
  });

  it("should exclude a fully hidden ID-only service from oidcClients", async () => {
    getAllServices.mockReturnValue({
      services: [
        {
          id: "hidden-id-only",
          name: "Hidden Id Only Service",
          isIdOnlyService: true,
          isHiddenService: true,
          relyingParty: {
            params: {
              hideApprover: "true",
              hideSupport: "true",
              helpHidden: "true",
            },
          },
        },
      ],
    });

    await getConfirmNewUser(req, res);

    const oidcClientIds = res.render.mock.calls[0][1].oidcClients.map(
      (s) => s.id,
    );
    expect(oidcClientIds).not.toContain("hidden-id-only");
  });

  it("should include a partially-flagged ID-only service that is not fully hidden", async () => {
    getAllServices.mockReturnValue({
      services: [
        {
          id: "partial-id-only",
          name: "Partial Id Only Service",
          isIdOnlyService: true,
          isHiddenService: true,
          relyingParty: { params: {} },
        },
      ],
    });

    await getConfirmNewUser(req, res);

    const oidcClientIds = res.render.mock.calls[0][1].oidcClients.map(
      (s) => s.id,
    );
    expect(oidcClientIds).toContain("partial-id-only");
  });
});
