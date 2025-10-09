jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("login.dfe.api-client/organisations");

const {
  getPendingRequestsAssociatedWithUser,
} = require("../../../src/infrastructure/organisations");
const {
  rejectOpenOrganisationRequestsForUser,
} = require("../../../src/app/users/utils");
const {
  updateRequestForOrganisationRaw,
} = require("login.dfe.api-client/organisations");

Date.now = jest.fn(() => "2019-01-02");

describe("When rejecting all organisation requests for a user", () => {
  const userId = "user-1";
  let req;

  beforeEach(() => {
    getPendingRequestsAssociatedWithUser.mockReset().mockReturnValue([
      {
        id: "requestId",
        org_id: "org1",
        org_name: "org name",
        urn: null,
        ukprn: null,
        uid: null,
        org_status: {
          id: 1,
          name: "Open",
        },
        user_id: "user 1",
        created_at: "12/12/2019",
        status: {
          id: 0,
          name: "pending",
        },
      },
    ]);
    // Returns 204 on success
    updateRequestForOrganisationRaw.mockReset().mockReturnValue(undefined);

    req = {
      id: "correlation-id",
      user: {
        sub: "suser1",
        email: "super.user@unit.test",
      },
    };
  });

  it("then it should call updateRequestForOrganisationRaw when a pending request is found", async () => {
    await rejectOpenOrganisationRequestsForUser(userId, req);

    expect(getPendingRequestsAssociatedWithUser.mock.calls).toHaveLength(1);
    expect(getPendingRequestsAssociatedWithUser.mock.calls[0][0]).toBe(
      "user-1",
    );
    expect(updateRequestForOrganisationRaw.mock.calls).toHaveLength(1);
  });

  it("should continue to work when getPendingRequestsAssociatedWithUser returns null on a 404 or 401", async () => {
    getPendingRequestsAssociatedWithUser.mockReset().mockReturnValue(null);
    await rejectOpenOrganisationRequestsForUser(userId, req);
    expect(updateRequestForOrganisationRaw.mock.calls).toMatchObject([]);
  });

  it("should call updateRequestForOrganisationRaw when the returned request has a status of 0, 2 or 3", async () => {
    getPendingRequestsAssociatedWithUser.mockReset().mockReturnValue([
      {
        id: "0b62b8da-2a6e-4c66-9f32-a7b784ff4f65",
        org_id: "org1",
        org_name: "org name",
        urn: null,
        ukprn: null,
        uid: null,
        org_status: {
          id: 1,
          name: "Open",
        },
        user_id: "user 1",
        created_at: "12/12/2019",
        status: {
          id: 0,
          name: "pending",
        },
      },
      {
        id: "42e765df-d1ce-4bc1-843c-71d5f69ad2ed",
        org_id: "org1",
        org_name: "org name",
        urn: null,
        ukprn: null,
        uid: null,
        org_status: {
          id: 1,
          name: "Open",
        },
        user_id: "user 1",
        created_at: "12/12/2019",
        status: {
          id: 2,
          name: "overdue",
        },
      },
      {
        id: "2fc17d50-d641-4175-895e-e7bbba65c25e",
        org_id: "org1",
        org_name: "org name",
        urn: null,
        ukprn: null,
        uid: null,
        org_status: {
          id: 1,
          name: "Open",
        },
        user_id: "user 1",
        created_at: "12/12/2019",
        status: {
          id: 3,
          name: "No approver",
        },
      },
      {
        id: "ed383257-2091-41ed-8422-5c59deb19b02",
        org_id: "org1",
        org_name: "org name",
        urn: null,
        ukprn: null,
        uid: null,
        org_status: {
          id: 1,
          name: "Open",
        },
        user_id: "user 1",
        created_at: "12/12/2019",
        status: {
          id: -1,
          name: "rejected",
        },
      },
    ]);
    await rejectOpenOrganisationRequestsForUser(userId, req);
    expect(updateRequestForOrganisationRaw.mock.calls).toHaveLength(3);
    expect(updateRequestForOrganisationRaw).toHaveBeenCalledWith({
      actionedAt: "2019-01-02",
      actionedByUserId: "suser1",
      reason: "User deactivation",
      requestId: "0b62b8da-2a6e-4c66-9f32-a7b784ff4f65",
      status: -1,
    });
    expect(updateRequestForOrganisationRaw).toHaveBeenCalledWith({
      actionedAt: "2019-01-02",
      actionedByUserId: "suser1",
      reason: "User deactivation",
      requestId: "42e765df-d1ce-4bc1-843c-71d5f69ad2ed",
      status: -1,
    });
    expect(updateRequestForOrganisationRaw).toHaveBeenCalledWith({
      actionedAt: "2019-01-02",
      actionedByUserId: "suser1",
      reason: "User deactivation",
      requestId: "2fc17d50-d641-4175-895e-e7bbba65c25e",
      status: -1,
    });
  });
});
