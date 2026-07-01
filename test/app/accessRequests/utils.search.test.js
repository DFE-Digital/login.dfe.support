jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger");
jest.mock("./../../../src/infrastructure/accessRequests");
jest.mock("login.dfe.jobs-client");
jest.mock("login.dfe.api-client/users");
jest.mock("login.dfe.api-client/organisations");

const {
  getSearchIndexUsersRaw,
  getPendingRequestsRaw,
} = require("login.dfe.api-client/users");
const {
  getOrganisationRequestsRaw,
} = require("login.dfe.api-client/organisations");
const { search } = require("./../../../src/app/accessRequests/utils");

const makeReq = (body = {}) => ({
  method: "POST",
  body,
  query: {},
});

const emptyOrgResult = {
  requests: [],
  totalNumberOfPages: 0,
  totalNumberOfRecords: 0,
};

describe("search - email filtering", () => {
  beforeEach(() => {
    getSearchIndexUsersRaw.mockReset();
    getPendingRequestsRaw.mockReset().mockResolvedValue([]);
    getOrganisationRequestsRaw.mockReset().mockResolvedValue(emptyOrgResult);
  });

  it("does not call getSearchIndexUsersRaw when searchEmail is absent", async () => {
    await search(makeReq({}));

    expect(getSearchIndexUsersRaw).not.toHaveBeenCalled();
  });

  it("does not call getPendingRequestsRaw when searchEmail is absent", async () => {
    await search(makeReq({}));

    expect(getPendingRequestsRaw).not.toHaveBeenCalled();
  });

  it("returns noUserFound true and empty accessRequests when no user matches the email", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({ users: [] });

    const result = await search(
      makeReq({ searchEmail: "notfound@example.com" }),
    );

    expect(result.noUserFound).toBe(true);
    expect(result.accessRequests).toEqual([]);
    expect(result.searchEmail).toBe("notfound@example.com");
    expect(getPendingRequestsRaw).not.toHaveBeenCalled();
  });

  it("calls getPendingRequestsRaw with userId when user is found by email", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [{ id: "user-abc-123", email: "user@example.com" }],
    });

    await search(makeReq({ searchEmail: "user@example.com" }));

    expect(getPendingRequestsRaw).toHaveBeenCalledWith({
      userId: "user-abc-123",
    });
    expect(getOrganisationRequestsRaw).not.toHaveBeenCalled();
  });

  it("matches email case-insensitively", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [{ id: "user-abc-123", email: "USER@EXAMPLE.COM" }],
    });

    await search(makeReq({ searchEmail: "user@example.com" }));

    expect(getPendingRequestsRaw).toHaveBeenCalledWith({
      userId: "user-abc-123",
    });
  });

  it("ignores search results where email does not exactly match", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [{ id: "other-user", email: "xuser@example.com" }],
    });

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.noUserFound).toBe(true);
    expect(getPendingRequestsRaw).not.toHaveBeenCalled();
  });

  it("returns noUserFound true when getSearchIndexUsersRaw returns null", async () => {
    getSearchIndexUsersRaw.mockResolvedValue(null);

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.noUserFound).toBe(true);
    expect(result.accessRequests).toEqual([]);
    expect(getPendingRequestsRaw).not.toHaveBeenCalled();
  });

  it("propagates errors thrown by getSearchIndexUsersRaw", async () => {
    getSearchIndexUsersRaw.mockRejectedValue(
      new Error("Azure Search unavailable"),
    );

    await expect(
      search(makeReq({ searchEmail: "user@example.com" })),
    ).rejects.toThrow("Azure Search unavailable");

    expect(getPendingRequestsRaw).not.toHaveBeenCalled();
  });

  it("does not match a user whose email is null", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [{ id: "other-user", email: null }],
    });

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.noUserFound).toBe(true);
    expect(getPendingRequestsRaw).not.toHaveBeenCalled();
  });

  it("trims leading and trailing whitespace from searchEmail before resolving", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [{ id: "user-abc-123", email: "user@example.com" }],
    });

    await search(makeReq({ searchEmail: "  user@example.com  " }));

    expect(getSearchIndexUsersRaw).toHaveBeenCalledWith(
      expect.objectContaining({ searchCriteria: "user@example.com" }),
    );
    expect(getPendingRequestsRaw).toHaveBeenCalledWith({
      userId: "user-abc-123",
    });
  });

  it("selects the exact match when multiple users are returned by Azure Search", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [
        { id: "wrong-user", email: "user@example.com.au" },
        { id: "correct-user", email: "user@example.com" },
        { id: "another-user", email: "xuser@example.com" },
      ],
    });

    await search(makeReq({ searchEmail: "user@example.com" }));

    expect(getPendingRequestsRaw).toHaveBeenCalledWith({
      userId: "correct-user",
    });
  });

  it("returns searchEmail in result when search runs without email", async () => {
    const result = await search(makeReq({}));

    expect(result.searchEmail).toBe("");
  });

  it("returns searchEmail in result when user is found", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [{ id: "user-abc-123", email: "user@example.com" }],
    });

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.searchEmail).toBe("user@example.com");
  });

  it("adds request_type to results from getPendingRequestsRaw", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [{ id: "user-abc-123", email: "user@example.com" }],
    });
    getPendingRequestsRaw.mockResolvedValue([
      {
        id: "req-1",
        org_id: "org-1",
        org_name: "Test Org",
        user_id: "user-abc-123",
        status: { id: 0, name: "Awaiting" },
      },
    ]);

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.accessRequests[0].request_type).toEqual({
      id: "organisation",
      name: "Organisation access",
    });
  });

  it("returns all user requests without pagination when searching by email", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [{ id: "user-abc-123", email: "user@example.com" }],
    });
    getPendingRequestsRaw.mockResolvedValue([
      {
        id: "req-1",
        org_id: "org-1",
        org_name: "Org One",
        user_id: "user-abc-123",
        status: { id: 0, name: "Awaiting" },
      },
      {
        id: "req-2",
        org_id: "org-2",
        org_name: "Org Two",
        user_id: "user-abc-123",
        status: { id: 2, name: "Overdue" },
      },
    ]);

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.totalNumberOfResults).toBe(2);
    expect(result.accessRequests.length).toBe(2);
    expect(result.page).toBe(1);
    expect(result.numberOfPages).toBe(1);
  });

  it("returns empty accessRequests when getPendingRequestsRaw returns null", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [{ id: "user-abc-123", email: "user@example.com" }],
    });
    getPendingRequestsRaw.mockResolvedValue(null);

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.accessRequests).toEqual([]);
    expect(result.totalNumberOfResults).toBe(0);
  });
});
