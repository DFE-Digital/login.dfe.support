jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger");
jest.mock("./../../../src/infrastructure/accessRequests");
jest.mock("login.dfe.jobs-client");
jest.mock("login.dfe.api-client/users");
jest.mock("login.dfe.api-client/organisations");
jest.mock("login.dfe.validation", () => ({
  emailPolicy: {
    doesEmailMeetPolicy: jest.fn((email) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    ),
  },
}));

const {
  getUserRaw,
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
    getUserRaw.mockReset();
    getPendingRequestsRaw.mockReset().mockResolvedValue([]);
    getOrganisationRequestsRaw.mockReset().mockResolvedValue(emptyOrgResult);
  });

  it("does not call getUserRaw when searchEmail is absent", async () => {
    await search(makeReq({}));

    expect(getUserRaw).not.toHaveBeenCalled();
  });

  it("does not call getPendingRequestsRaw when searchEmail is absent", async () => {
    await search(makeReq({}));

    expect(getPendingRequestsRaw).not.toHaveBeenCalled();
  });

  it("returns noUserFound true and empty accessRequests when getUserRaw returns null", async () => {
    getUserRaw.mockResolvedValue(null);

    const result = await search(
      makeReq({ searchEmail: "notfound@example.com" }),
    );

    expect(result.noUserFound).toBe(true);
    expect(result.accessRequests).toEqual([]);
    expect(result.searchEmail).toBe("notfound@example.com");
    expect(getPendingRequestsRaw).not.toHaveBeenCalled();
  });

  it("calls getPendingRequestsRaw with userId when user is found by email", async () => {
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
    });

    await search(makeReq({ searchEmail: "user@example.com" }));

    expect(getPendingRequestsRaw).toHaveBeenCalledWith({
      userId: "user-abc-123",
    });
    expect(getOrganisationRequestsRaw).not.toHaveBeenCalled();
  });

  it("calls getUserRaw with the exact email address", async () => {
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
    });

    await search(makeReq({ searchEmail: "user@example.com" }));

    expect(getUserRaw).toHaveBeenCalledWith({
      by: { email: "user@example.com" },
    });
  });

  it("propagates errors thrown by getUserRaw", async () => {
    getUserRaw.mockRejectedValue(new Error("Directories API unavailable"));

    await expect(
      search(makeReq({ searchEmail: "user@example.com" })),
    ).rejects.toThrow("Directories API unavailable");

    expect(getPendingRequestsRaw).not.toHaveBeenCalled();
  });

  it.each([
    ["missing @ sign", "notanemail"],
    ["path traversal with ..", "foo@bar.com/../admin"],
    ["forward slash in input", "foo@bar.com/inject"],
  ])(
    "returns noUserFound true and skips getUserRaw for malformed input: %s",
    async (_desc, badInput) => {
      const result = await search(makeReq({ searchEmail: badInput }));

      expect(getUserRaw).not.toHaveBeenCalled();
      expect(result.noUserFound).toBe(true);
      expect(result.accessRequests).toEqual([]);
    },
  );

  it("trims leading and trailing whitespace from searchEmail before resolving", async () => {
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
    });

    await search(makeReq({ searchEmail: "  user@example.com  " }));

    expect(getUserRaw).toHaveBeenCalledWith({
      by: { email: "user@example.com" },
    });
    expect(getPendingRequestsRaw).toHaveBeenCalledWith({
      userId: "user-abc-123",
    });
  });

  it("returns searchEmail in result when search runs without email", async () => {
    const result = await search(makeReq({}));

    expect(result.searchEmail).toBe("");
  });

  it("returns searchEmail in result when user is found", async () => {
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
    });

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.searchEmail).toBe("user@example.com");
  });

  it("adds request_type to results from getPendingRequestsRaw", async () => {
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
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
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
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
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
    });
    getPendingRequestsRaw.mockResolvedValue(null);

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.accessRequests).toEqual([]);
    expect(result.totalNumberOfResults).toBe(0);
  });
});
