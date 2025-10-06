jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("login.dfe.api-client/users");

const {
  deleteUserServiceAccess,
  getUserServicesRaw,
} = require("login.dfe.api-client/users");
const { removeAllServicesForUser } = require("../../../src/app/users/utils");

describe("When removing all services for a user", () => {
  const userId = "user-1";
  let req;

  beforeEach(() => {
    getUserServicesRaw.mockReset().mockReturnValue([
      {
        userId: "user-1",
        serviceId: "service1Id",
        organisationId: "organisation-1",
        roles: [],
      },
      {
        userId: "user-1",
        serviceId: "service2Id",
        organisationId: "organisation-1",
        roles: [],
      },
    ]);
    // Returns 204 on success
    deleteUserServiceAccess.mockReset().mockReturnValue(undefined);

    req = {
      id: "correlation-id",
    };
  });

  it("then it should get user from users index", async () => {
    await removeAllServicesForUser(userId, req);

    expect(getUserServicesRaw.mock.calls).toHaveLength(1);
    expect(getUserServicesRaw).toHaveBeenCalledWith({ userId: "user-1" });
    expect(deleteUserServiceAccess.mock.calls).toHaveLength(2);
  });

  it("should continue to work when getServicesByInvitationId returns undefined on a 404", async () => {
    getUserServicesRaw.mockReset().mockReturnValue(undefined);
    await removeAllServicesForUser(userId, req);

    expect(getUserServicesRaw.mock.calls).toHaveLength(1);
    expect(getUserServicesRaw).toHaveBeenCalledWith({ userId: "user-1" });
    expect(deleteUserServiceAccess.mock.calls).toHaveLength(0);
  });
});
