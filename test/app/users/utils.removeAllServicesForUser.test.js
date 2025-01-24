jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/access");

const {
  getServicesByUserId,
  removeServiceFromUser,
} = require("../../../src/infrastructure/access");
const { removeAllServicesForUser } = require("../../../src/app/users/utils");

describe("When removing all services for a user", () => {
  const userId = "user-1";
  let req;

  beforeEach(() => {
    getServicesByUserId.mockReset().mockReturnValue([
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
    removeServiceFromUser.mockReset().mockReturnValue(undefined);

    req = {
      id: "correlation-id",
    };
  });

  it("then it should get user from users index", async () => {
    await removeAllServicesForUser(userId, req);

    expect(getServicesByUserId.mock.calls).toHaveLength(1);
    expect(getServicesByUserId.mock.calls[0][0]).toBe("user-1");
    expect(removeServiceFromUser.mock.calls).toHaveLength(2);
  });

  it("should continue to work when getServicesByInvitationId returns undefined on a 404", async () => {
    getServicesByUserId.mockReset().mockReturnValue(undefined);
    await removeAllServicesForUser(userId, req);

    expect(getServicesByUserId.mock.calls).toHaveLength(1);
    expect(getServicesByUserId.mock.calls[0][0]).toBe("user-1");
    expect(removeServiceFromUser.mock.calls).toHaveLength(0);
  });
});
