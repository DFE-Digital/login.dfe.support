jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/users");
jest.mock("login.dfe.jobs-client");
jest.mock("login.dfe.async-retry");

const {
  deleteUserServiceAccess,
  getUserServicesRaw,
} = require("login.dfe.api-client/users");
const { ServiceNotificationsClient } = require("login.dfe.jobs-client");
const asyncRetry = require("login.dfe.async-retry");
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
    logger.audit.mockReset();

    asyncRetry.mockReset().mockImplementation(async (fn) => {
      return fn();
    });
    asyncRetry.strategies = {
      apiStrategy: "api-strategy",
    };

    req = {
      id: "correlation-id",
      user: {
        sub: "suser1",
        email: "super.user@unit.test",
      },
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

    expect(asyncRetry.mock.calls).toHaveLength(2);
    expect(asyncRetry).toHaveBeenCalledWith(
      expect.any(Function),
      asyncRetry.strategies.apiStrategy,
    );
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
    // The client is constructed once regardless of how many services are processed
    expect(ServiceNotificationsClient).toHaveBeenCalledTimes(1);
  });

  it("then it should log an audit entry for each successful WS sync notification", async () => {
    await removeAllServicesForUser(userId, req);

    expect(logger.audit).toHaveBeenCalledTimes(2);
    expect(logger.audit).toHaveBeenCalledWith(
      expect.stringContaining("WS Sync notification"),
      expect.objectContaining({
        type: "support",
        subType: "user-sync-notify",
        userId: "suser1",
        userEmail: "super.user@unit.test",
        editedUser: "user-1",
        organisationId: "organisation-1",
        editedFields: [
          {
            name: "remove_service",
            oldValue: "service1Id",
            newValue: undefined,
          },
        ],
        success: true,
      }),
    );
    expect(logger.audit).toHaveBeenCalledWith(
      expect.stringContaining("WS Sync notification"),
      expect.objectContaining({
        type: "support",
        subType: "user-sync-notify",
        userId: "suser1",
        userEmail: "super.user@unit.test",
        editedUser: "user-1",
        organisationId: "organisation-1",
        editedFields: [
          {
            name: "remove_service",
            oldValue: "service2Id",
            newValue: undefined,
          },
        ],
        success: true,
      }),
    );
  });

  it("then it should continue processing remaining services if a WS sync notification fails", async () => {
    notifyUserUpdatedStub
      .mockRejectedValueOnce(new Error("sync failed"))
      .mockResolvedValueOnce(undefined);

    await expect(removeAllServicesForUser(userId, req)).resolves.not.toThrow();

    expect(deleteUserServiceAccess.mock.calls).toHaveLength(2);
    expect(notifyUserUpdatedStub.mock.calls).toHaveLength(2);
    expect(logger.error.mock.calls).toHaveLength(1);
    expect(logger.audit).toHaveBeenCalledWith(
      expect.stringContaining("WS Sync notification"),
      expect.objectContaining({
        type: "support",
        subType: "user-sync-notify",
        userId: "suser1",
        userEmail: "super.user@unit.test",
        editedUser: "user-1",
        organisationId: "organisation-1",
        editedFields: [
          {
            name: "remove_service",
            oldValue: "service1Id",
            newValue: undefined,
          },
        ],
        success: false,
      }),
    );
    expect(logger.audit).toHaveBeenCalledWith(
      expect.stringContaining("WS Sync notification"),
      expect.objectContaining({
        type: "support",
        subType: "user-sync-notify",
        userId: "suser1",
        userEmail: "super.user@unit.test",
        editedUser: "user-1",
        organisationId: "organisation-1",
        editedFields: [
          {
            name: "remove_service",
            oldValue: "service2Id",
            newValue: undefined,
          },
        ],
        success: true,
      }),
    );
  });
});
