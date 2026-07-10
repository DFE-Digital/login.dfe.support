jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/users");
jest.mock("login.dfe.jobs-client");

const {
  deleteUserServiceAccess,
  getUserServicesRaw,
} = require("login.dfe.api-client/users");
const { ServiceNotificationsClient } = require("login.dfe.jobs-client");
const logger = require("./../../../src/infrastructure/logger");
const { removeAllServicesForUser } = require("../../../src/app/users/utils");

describe("When removing all services for a user", () => {
  const userId = "user-1";
  let req;
  let notifyUserUpdatedStub;

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

    notifyUserUpdatedStub = jest.fn().mockResolvedValue(undefined);
    ServiceNotificationsClient.mockReset().mockImplementation(() => ({
      notifyUserUpdated: notifyUserUpdatedStub,
    }));

    logger.error.mockReset();

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

  it("then it should send a WS sync notification for each service removed", async () => {
    await removeAllServicesForUser(userId, req);

    expect(notifyUserUpdatedStub.mock.calls).toHaveLength(2);
    expect(notifyUserUpdatedStub).toHaveBeenCalledWith({
      sub: "user-1",
      removedServiceId: "service1Id",
      removedOrgId: "organisation-1",
    });
    expect(notifyUserUpdatedStub).toHaveBeenCalledWith({
      sub: "user-1",
      removedServiceId: "service2Id",
      removedOrgId: "organisation-1",
    });
  });

  it("then it should continue processing remaining services if a WS sync notification fails", async () => {
    notifyUserUpdatedStub
      .mockRejectedValueOnce(new Error("sync failed"))
      .mockResolvedValueOnce(undefined);

    await expect(removeAllServicesForUser(userId, req)).resolves.not.toThrow();

    expect(deleteUserServiceAccess.mock.calls).toHaveLength(2);
    expect(notifyUserUpdatedStub.mock.calls).toHaveLength(2);
    expect(logger.error.mock.calls).toHaveLength(1);
  });
});
