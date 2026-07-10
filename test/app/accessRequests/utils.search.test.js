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
  getUserServiceRequestsRaw,
} = require("login.dfe.api-client/users");
const {
  getOrganisationRequestsRaw,
  getOrganisationRaw,
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
    getUserServiceRequestsRaw.mockReset().mockResolvedValue([]);
    getOrganisationRaw
      .mockReset()
      .mockResolvedValue({ name: "Test Organisation" });
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

  it("calls getUserServiceRequestsRaw with userId when user is found by email", async () => {
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
    });

    await search(makeReq({ searchEmail: "user@example.com" }));

    expect(getUserServiceRequestsRaw).toHaveBeenCalledWith({
      userId: "user-abc-123",
    });
  });

  it("returns service requests alongside org requests when searching by email", async () => {
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
    });
    getPendingRequestsRaw.mockResolvedValue([
      {
        id: "org-req-1",
        user_id: "user-abc-123",
        org_id: "org-1",
        org_name: "Test Org",
        created_date: "2023-01-16T00:00:00.000Z",
        status: { id: 2, name: "Overdue" },
      },
    ]);
    getUserServiceRequestsRaw.mockResolvedValue([
      {
        id: "svc-req-1",
        userId: "user-abc-123",
        organisationId: "org-2",
        createdAt: "2023-01-17T00:00:00.000Z",
        status: 2,
        requestType: "service",
      },
    ]);
    getOrganisationRaw.mockResolvedValue({ name: "Service Org" });

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.totalNumberOfResults).toBe(2);
    expect(result.accessRequests).toHaveLength(2);
    expect(result.accessRequests[0].id).toBe("org-req-1");
    expect(result.accessRequests[1].id).toBe("svc-req-1");
  });

  it("normalizes service request shape to match controller expectations", async () => {
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
    });
    getPendingRequestsRaw.mockResolvedValue([]);
    getUserServiceRequestsRaw.mockResolvedValue([
      {
        id: "svc-req-1",
        userId: "user-abc-123",
        organisationId: "org-99",
        createdAt: "2023-06-01T10:00:00.000Z",
        status: 2,
        requestType: "service",
      },
    ]);
    getOrganisationRaw.mockResolvedValue({ name: "Example School" });

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    const req = result.accessRequests[0];
    expect(req.user_id).toBe("user-abc-123");
    expect(req.created_date).toBe("2023-06-01T10:00:00.000Z");
    expect(req.org_name).toBe("Example School");
    expect(req.status).toEqual({ id: 2, name: "Overdue" });
    expect(req.request_type).toEqual({ id: "service", name: "Service access" });
  });

  it("fetches org name once per unique organisation when normalizing service requests", async () => {
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
    });
    getPendingRequestsRaw.mockResolvedValue([]);
    getUserServiceRequestsRaw.mockResolvedValue([
      {
        id: "svc-1",
        userId: "user-abc-123",
        organisationId: "org-99",
        createdAt: "2023-01-01T00:00:00.000Z",
        status: 2,
        requestType: "service",
      },
      {
        id: "svc-2",
        userId: "user-abc-123",
        organisationId: "org-99",
        createdAt: "2023-02-01T00:00:00.000Z",
        status: 2,
        requestType: "subService",
      },
    ]);
    getOrganisationRaw.mockResolvedValue({ name: "Shared Org" });

    await search(makeReq({ searchEmail: "user@example.com" }));

    expect(getOrganisationRaw).toHaveBeenCalledTimes(1);
    expect(getOrganisationRaw).toHaveBeenCalledWith({
      by: { organisationId: "org-99" },
    });
  });

  it("filters by request type when type filter is applied alongside email search", async () => {
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
    });
    getPendingRequestsRaw.mockResolvedValue([
      {
        id: "org-req-1",
        user_id: "user-abc-123",
        org_id: "org-1",
        org_name: "Test Org",
        created_date: "2023-01-01T00:00:00.000Z",
        status: { id: 2, name: "Overdue" },
      },
    ]);
    getUserServiceRequestsRaw.mockResolvedValue([
      {
        id: "svc-req-1",
        userId: "user-abc-123",
        organisationId: "org-2",
        createdAt: "2023-01-02T00:00:00.000Z",
        status: 2,
        requestType: "service",
      },
    ]);

    const result = await search(
      makeReq({ searchEmail: "user@example.com", requestType: "service" }),
    );

    expect(result.accessRequests).toHaveLength(1);
    expect(result.accessRequests[0].id).toBe("svc-req-1");
    expect(result.totalNumberOfResults).toBe(1);
  });

  it("filters by status when status filter is applied alongside email search", async () => {
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
    });
    getPendingRequestsRaw.mockResolvedValue([
      {
        id: "org-req-pending",
        user_id: "user-abc-123",
        org_id: "org-1",
        org_name: "Test Org",
        created_date: "2023-01-01T00:00:00.000Z",
        status: { id: 0, name: "Pending" },
      },
      {
        id: "org-req-overdue",
        user_id: "user-abc-123",
        org_id: "org-1",
        org_name: "Test Org",
        created_date: "2023-01-02T00:00:00.000Z",
        status: { id: 2, name: "Overdue" },
      },
    ]);
    getUserServiceRequestsRaw.mockResolvedValue([]);

    const result = await search(
      makeReq({ searchEmail: "user@example.com", status: "2" }),
    );

    expect(result.accessRequests).toHaveLength(1);
    expect(result.accessRequests[0].id).toBe("org-req-overdue");
    expect(result.totalNumberOfResults).toBe(1);
  });

  it("returns empty results when type filter eliminates all requests in email search", async () => {
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
    });
    getPendingRequestsRaw.mockResolvedValue([
      {
        id: "org-req-1",
        user_id: "user-abc-123",
        org_id: "org-1",
        org_name: "Test Org",
        created_date: "2023-01-01T00:00:00.000Z",
        status: { id: 2, name: "Overdue" },
      },
    ]);
    getUserServiceRequestsRaw.mockResolvedValue([]);

    const result = await search(
      makeReq({ searchEmail: "user@example.com", requestType: "service" }),
    );

    expect(result.accessRequests).toHaveLength(0);
    expect(result.totalNumberOfResults).toBe(0);
    expect(result.numberOfPages).toBe(0);
  });

  it("handles null from getUserServiceRequestsRaw gracefully", async () => {
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
    });
    getPendingRequestsRaw.mockResolvedValue([]);
    getUserServiceRequestsRaw.mockResolvedValue(null);

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.accessRequests).toEqual([]);
    expect(result.totalNumberOfResults).toBe(0);
  });

  it("normalizes subService request type correctly", async () => {
    getUserRaw.mockResolvedValue({
      sub: "user-abc-123",
      email: "user@example.com",
    });
    getPendingRequestsRaw.mockResolvedValue([]);
    getUserServiceRequestsRaw.mockResolvedValue([
      {
        id: "svc-req-1",
        userId: "user-abc-123",
        organisationId: "org-99",
        createdAt: "2023-06-01T10:00:00.000Z",
        status: 0,
        requestType: "subService",
      },
    ]);
    getOrganisationRaw.mockResolvedValue({ name: "Example School" });

    const result = await search(makeReq({ searchEmail: "user@example.com" }));

    expect(result.accessRequests[0].request_type).toEqual({
      id: "subService",
      name: "Sub-service access",
    });
    expect(result.accessRequests[0].status).toEqual({ id: 0, name: "Pending" });
  });
});
