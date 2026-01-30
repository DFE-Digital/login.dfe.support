jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/users", () => ({
  getUserServiceRequestsRaw: jest.fn(),
}));
jest.mock("login.dfe.api-client/services", () => ({
  updateServiceRequest: jest.fn(),
}));
const { getUserServiceRequestsRaw } = require("login.dfe.api-client/users");
const { updateServiceRequest } = require("login.dfe.api-client/services");
const {
  rejectOpenUserServiceRequestsForUser,
} = require("../../../src/app/users/utils");

describe("When rejecting all open service requests for a user", () => {
  const userId = "user-1";
  let req;

  beforeEach(() => {
    getUserServiceRequestsRaw.mockReset().mockReturnValue([
      {
        id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        userId: "01A52B72-AE88-47BC-800B-E7DFFCE54344",
        serviceId: "7B7E2D82-1228-4547-907C-40A2A35D0704",
        organisationId: "11BE2E1F-4227-4FDE-81D9-14B1E3322D48",
        status: 2,
        createdAt: "2024-06-04T09:47:36.718Z",
        updatedAt: "2024-06-09T00:00:00.173Z",
        requestType: "service",
      },
    ]);

    req = {
      id: "correlation-id",
      user: {
        sub: "suser1",
        email: "super.user@unit.test",
      },
    };
  });

  it("should remove one if one is returned by getUserServiceRequestsRaw", async () => {
    await rejectOpenUserServiceRequestsForUser(userId, req);

    expect(getUserServiceRequestsRaw.mock.calls).toHaveLength(1);
    expect(getUserServiceRequestsRaw).toHaveBeenCalledWith({
      userId: "user-1",
    });
    expect(updateServiceRequest.mock.calls).toHaveLength(1);
  });

  it("should continue to work when getUserServiceRequestsRaw returns undefined on a 404", async () => {
    getUserServiceRequestsRaw.mockReset().mockReturnValue(undefined);
    await rejectOpenUserServiceRequestsForUser(userId, req);

    expect(getUserServiceRequestsRaw.mock.calls).toHaveLength(1);
    expect(getUserServiceRequestsRaw).toHaveBeenCalledWith({
      userId: "user-1",
    });
    expect(updateServiceRequest.mock.calls).toHaveLength(0);
  });

  it("should call updateServiceRequest when the returned request has a status of 0, 2 or 3 only", async () => {
    getUserServiceRequestsRaw.mockReset().mockReturnValue([
      {
        id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        userId: "01A52B72-AE88-47BC-800B-E7DFFCE54344",
        serviceId: "7B7E2D82-1228-4547-907C-40A2A35D0704",
        organisationId: "11BE2E1F-4227-4FDE-81D9-14B1E3322D48",
        status: 0,
        createdAt: "2024-06-04T09:47:36.718Z",
        updatedAt: "2024-06-09T00:00:00.173Z",
        requestType: "service",
      },
      {
        id: "dd657fbb-65b6-4b08-bab8-6d85069b59fa",
        userId: "01A52B72-AE88-47BC-800B-E7DFFCE54344",
        serviceId: "1dbafbb3-be86-462f-9fd2-d6681ab2873a",
        organisationId: "11BE2E1F-4227-4FDE-81D9-14B1E3322D48",
        status: 2,
        createdAt: "2024-06-04T09:47:36.718Z",
        updatedAt: "2024-06-09T00:00:00.173Z",
        requestType: "service",
      },
      {
        id: "e3a843d1-0866-4e9f-904f-391bfb769c2d",
        userId: "01A52B72-AE88-47BC-800B-E7DFFCE54344",
        serviceId: "1dbafbb3-be86-462f-9fd2-d6681ab2873a",
        organisationId: "11BE2E1F-4227-4FDE-81D9-14B1E3322D48",
        status: 3,
        createdAt: "2024-06-04T09:47:36.718Z",
        updatedAt: "2024-06-09T00:00:00.173Z",
        requestType: "service",
      },
      {
        id: "2adfac19-d682-4940-8b2f-0b82747e0daa",
        userId: "01A52B72-AE88-47BC-800B-E7DFFCE54344",
        serviceId: "91207517-8429-4388-9961-473df046d09e",
        organisationId: "11BE2E1F-4227-4FDE-81D9-14B1E3322D48",
        status: -1,
        createdAt: "2024-06-04T09:47:36.718Z",
        updatedAt: "2024-06-09T00:00:00.173Z",
        requestType: "service",
      },
    ]);
    await rejectOpenUserServiceRequestsForUser(userId, req);

    expect(updateServiceRequest.mock.calls).toHaveLength(3);

    expect(updateServiceRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceRequestId: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
        actionedByUserId: "suser1",
        reason: "User deactivation",
        status: -1,
      }),
    );

    expect(updateServiceRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceRequestId: "dd657fbb-65b6-4b08-bab8-6d85069b59fa",
        actionedByUserId: "suser1",
        reason: "User deactivation",
        status: -1,
      }),
    );

    expect(updateServiceRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceRequestId: "e3a843d1-0866-4e9f-904f-391bfb769c2d",
        actionedByUserId: "suser1",
        reason: "User deactivation",
        status: -1,
      }),
    );
  });
});
