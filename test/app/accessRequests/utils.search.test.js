jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger");
jest.mock("./../../../src/infrastructure/accessRequests");
jest.mock("login.dfe.jobs-client");
jest.mock("login.dfe.api-client/users");
jest.mock("login.dfe.api-client/organisations");

const { getSearchIndexUsersRaw } = require("login.dfe.api-client/users");
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
    getOrganisationRequestsRaw.mockReset().mockResolvedValue(emptyOrgResult);
  });

  it("does not call getSearchIndexUsersRaw when searchEmail is absent", async () => {
    await search(makeReq({}));

    expect(getSearchIndexUsersRaw).not.toHaveBeenCalled();
  });

  it("does not pass filterUserId to getOrganisationRequestsRaw when searchEmail is absent", async () => {
    await search(makeReq({}));

    expect(getOrganisationRequestsRaw).toHaveBeenCalledWith(
      expect.objectContaining({ filterUserId: undefined }),
    );
  });

  it("returns noUserFound true and empty accessRequests when no user matches the email", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({ users: [] });

    const result = await search(
      makeReq({ searchEmail: "notfound@example.com" }),
    );

    expect(result.noUserFound).toBe(true);
    expect(result.accessRequests).toEqual([]);
    expect(result.searchEmail).toBe("notfound@example.com");
    expect(getOrganisationRequestsRaw).not.toHaveBeenCalled();
  });

  it("passes filterUserId to getOrganisationRequestsRaw when user is found by email", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [{ id: "user-abc-123", email: "user@example.com" }],
    });

    await search(makeReq({ searchEmail: "user@example.com" }));

    expect(getOrganisationRequestsRaw).toHaveBeenCalledWith(
      expect.objectContaining({ filterUserId: "user-abc-123" }),
    );
  });

  it("matches email case-insensitively", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [{ id: "user-abc-123", email: "USER@EXAMPLE.COM" }],
    });

    await search(makeReq({ searchEmail: "user@example.com" }));

    expect(getOrganisationRequestsRaw).toHaveBeenCalledWith(
      expect.objectContaining({ filterUserId: "user-abc-123" }),
    );
  });

  it("ignores search results where email does not exactly match", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [{ id: "other-user", email: "xuser@example.com" }],
    });

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.noUserFound).toBe(true);
    expect(getOrganisationRequestsRaw).not.toHaveBeenCalled();
  });

  it("returns noUserFound true when getSearchIndexUsersRaw returns null", async () => {
    getSearchIndexUsersRaw.mockResolvedValue(null);

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.noUserFound).toBe(true);
    expect(result.accessRequests).toEqual([]);
    expect(getOrganisationRequestsRaw).not.toHaveBeenCalled();
  });

  it("propagates errors thrown by getSearchIndexUsersRaw", async () => {
    getSearchIndexUsersRaw.mockRejectedValue(
      new Error("Azure Search unavailable"),
    );

    await expect(
      search(makeReq({ searchEmail: "user@example.com" })),
    ).rejects.toThrow("Azure Search unavailable");

    expect(getOrganisationRequestsRaw).not.toHaveBeenCalled();
  });

  it("does not match a user whose email is null", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [{ id: "other-user", email: null }],
    });

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.noUserFound).toBe(true);
    expect(getOrganisationRequestsRaw).not.toHaveBeenCalled();
  });

  it("trims leading and trailing whitespace from searchEmail before resolving", async () => {
    getSearchIndexUsersRaw.mockResolvedValue({
      users: [{ id: "user-abc-123", email: "user@example.com" }],
    });

    await search(makeReq({ searchEmail: "  user@example.com  " }));

    expect(getSearchIndexUsersRaw).toHaveBeenCalledWith(
      expect.objectContaining({ searchCriteria: "user@example.com" }),
    );
    expect(getOrganisationRequestsRaw).toHaveBeenCalledWith(
      expect.objectContaining({ filterUserId: "user-abc-123" }),
    );
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

    expect(getOrganisationRequestsRaw).toHaveBeenCalledWith(
      expect.objectContaining({ filterUserId: "correct-user" }),
    );
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
});
