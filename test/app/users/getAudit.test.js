jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("./../../../src/app/users/utils");
jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
}));
jest.mock("./../../../src/infrastructure/serviceMapping");
jest.mock("./../../../src/infrastructure/audit");
jest.mock("login.dfe.api-client/users");
jest.mock("ioredis");
jest.mock("login.dfe.api-client/organisations");

const { getUserDetailsById } = require("./../../../src/app/users/utils");
const { sendResult } = require("./../../../src/infrastructure/utils");
const { getPageOfUserAudits } = require("./../../../src/infrastructure/audit");
const {
  getServiceIdForClientId,
} = require("./../../../src/infrastructure/serviceMapping");
const { getServiceRaw } = require("login.dfe.api-client/services");
const getAudit = require("./../../../src/app/users/getAudit");
const {
  getUserStatusRaw,
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");
const {
  getOrganisationLegacyRaw,
} = require("login.dfe.api-client/organisations");

const organisationId = "org-1";

const createSimpleAuditRecord = (type, subType, message) => {
  return {
    type,
    subType,
    userId: "user1",
    userEmail: "some.user@test.tester",
    editedUser: "edited-user1",
    organisationId,
    level: "audit",
    message,
    timestamp: "2025-01-29T17:31:00.000Z",
  };
};

describe("when getting users audit details", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      id: "correlationId",
      csrfToken: () => "token",
      accepts: () => ["text/html"],
      session: { type: "audit", params: { searchType: "organisations" } },
      query: {
        page: 3,
      },
      params: {
        uid: "user1",
      },
    };

    res = {
      render: jest.fn(),
      status: jest.fn(),
      send: jest.fn(),
    };
    res.render.mockReturnValue(res);
    res.status.mockReturnValue(res);

    getUserStatusRaw.mockReset();
    getUserStatusRaw.mockReturnValue({
      id: "user1",
      status: 0,
      statusChangeReasons: [
        {
          id: 1,
          user_id: "user1",
          old_status: 1,
          new_status: 0,
          reason: "Deactivation reason",
        },
      ],
    });

    getUserDetailsById.mockReset();
    getUserDetailsById.mockImplementation(async (userId) => {
      return {
        id: userId,
        firstName: "Test",
        lastName: "User",
        status: {
          id: 1,
          description: "Activated",
        },
      };
    });

    getOrganisationLegacyRaw.mockReset();
    getOrganisationLegacyRaw.mockResolvedValue({
      id: "org-1",
      name: "Test Organisation",
    });

    getUserOrganisationsWithServicesRaw.mockReset();
    getUserOrganisationsWithServicesRaw.mockResolvedValue([]);

    sendResult.mockReset();

    getPageOfUserAudits.mockReset();
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          type: "sign-in",
          subType: "username-password",
          success: true,
          userId: "user1",
          userEmail: "some.user@test.tester",
          level: "audit",
          message:
            "Successful login attempt for some.user@test.tester (id: user1)",
          timestamp: "2018-01-30T10:30:53.987Z",
          client: "client-1",
        },
        {
          type: "some-new-type",
          subType: "some-subtype",
          success: false,
          userId: "user1",
          userEmail: "some.user@test.tester",
          level: "audit",
          message: "Some detailed message",
          timestamp: "2018-01-29T17:31:00.000Z",
        },
        createSimpleAuditRecord(
          "manage",
          "user-service-added",
          "some.user@test.tester added service Test Service for user another.user@example.com",
        ),
      ],
      numberOfPages: 3,
      numberOfRecords: 56,
    });

    getServiceIdForClientId.mockReset();
    getServiceIdForClientId.mockImplementation((clientId) => {
      if (clientId === "client-1") {
        return "service-1";
      }
      if (clientId === "client-2") {
        return "service-2";
      }
      return null;
    });

    getServiceRaw.mockReset();
    getServiceRaw.mockImplementation(({ by: { serviceId } }) => {
      return {
        id: serviceId,
        name: serviceId,
        description: serviceId,
      };
    });
  });

  it("should call getUserDetailsById with correct userId and req parameters", async () => {
    await getAudit(req, res);

    expect(getUserDetailsById.mock.calls).toHaveLength(1);
    expect(getUserDetailsById.mock.calls[0][0]).toBe("user1");
    expect(getUserDetailsById.mock.calls[0][1]).toBe(req);
  });

  it("then it should send result using audit view", async () => {
    await getAudit(req, res);

    expect(getUserDetailsById.mock.calls).toHaveLength(1);
    expect(getUserDetailsById.mock.calls[0][0]).toBe(req.params.uid);

    expect(sendResult.mock.calls).toHaveLength(1);
    expect(sendResult.mock.calls[0][0]).toBe(req);
    expect(sendResult.mock.calls[0][1]).toBe(res);
    expect(sendResult.mock.calls[0][2]).toBe("users/views/audit");

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      csrfToken: "token",
      numberOfPages: 3,
      totalNumberOfResults: 56,
      user: {
        id: "user1",
        status: {
          id: 1,
          description: "Activated",
        },
      },
    });
  });

  it("should set the backlink to /organisations if the search type session param is organisations", async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      backLink: "/organisations",
    });
  });

  it("should set the backlink to /users if the search type session param is not organisations", async () => {
    req.session.params.searchType = "/users";
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      backLink: "/users",
    });
  });

  it("then it should include current page of audits in model", async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      audits: [
        {
          timestamp: new Date("2018-01-30T10:30:53.987Z"),
          event: {
            type: "sign-in",
            subType: "username-password",
            description: "Sign-in using email address and password",
          },
          service: {
            id: "service-1",
            name: "service-1",
            description: "service-1",
          },
          organisation: null,
          result: true,
          user: {
            id: "user1",
          },
        },
        {
          timestamp: new Date("2018-01-29T17:31:00.000Z"),
          event: {
            type: "some-new-type",
            subType: "some-subtype",
            description: "some-new-type / some-subtype",
          },
          organisation: null,
          service: null,
          result: false,
          user: {
            id: "user1",
          },
        },
        {
          timestamp: new Date("2025-01-29T17:31:00.000Z"),
          formattedTimestamp: "29 Jan 2025 05:31pm",
          event: {
            type: "manage",
            subType: "user-service-added",
            description:
              "some.user@test.tester added service Test Service for user another.user@example.com",
          },
          service: null,
          organisation: {
            id: "org-1",
            name: "Test Organisation",
          },
          result: true,
          user: {
            id: "user1",
            status: {
              id: 1,
              description: "Activated",
            },
            formattedLastLogin: "",
          },
        },
      ],
    });
  });

  it("should return the message as the type, if the type is Sign-out", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        createSimpleAuditRecord("Sign-out", undefined, "User logged out"),
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);

    const auditRows = sendResult.mock.calls[0][3].audits;
    expect(auditRows[0].event.description).toBe("Sign-out");
  });

  it("should leave a number of subtypes of message unchanged", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        createSimpleAuditRecord(
          "manage",
          "user-service-added",
          "some.user@test.tester added service Test Service for user another.user@example.com",
        ),
        createSimpleAuditRecord(
          "manage",
          "user-service-deleted",
          "some.user@test.tester removed service Test Service for user another.user@example.com",
        ),
        createSimpleAuditRecord(
          "organisation",
          "access-request",
          "some.user@test.tester requested organisation access",
        ),
        createSimpleAuditRecord(
          "services",
          "access-request",
          "some.user@test.tester requested service access",
        ),
        createSimpleAuditRecord(
          "support",
          "service-create",
          "some.user@test.tester created Check A Thing service",
        ),
        createSimpleAuditRecord(
          "manage",
          "service-config-updated",
          "some.user@test.tester updated service configuration",
        ),
      ],
      numberOfPages: 3,
      numberOfRecords: 56,
    });
    await getAudit(req, res);

    const auditRows = sendResult.mock.calls[0][3].audits;
    expect(auditRows[0].event.description).toBe(
      "some.user@test.tester added service Test Service for user another.user@example.com",
    );
    expect(auditRows[1].event.description).toBe(
      "some.user@test.tester removed service Test Service for user another.user@example.com",
    );
  });

  it("then it should include page number in model", async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      page: 3,
    });
  });

  it("then it should get page of audits using page 1 if page not specified", async () => {
    req.query.page = undefined;

    await getAudit(req, res);

    expect(getPageOfUserAudits.mock.calls).toHaveLength(1);
    expect(getPageOfUserAudits.mock.calls[0][0]).toBe("user1");
    expect(getPageOfUserAudits.mock.calls[0][1]).toBe(1);
  });

  it("then it should get page of audits using page specified", async () => {
    await getAudit(req, res);

    expect(getPageOfUserAudits.mock.calls).toHaveLength(1);
    expect(getPageOfUserAudits.mock.calls[0][0]).toBe("user1");
    expect(getPageOfUserAudits.mock.calls[0][1]).toBe(3);
  });

  it("then it should return 400 if specified page is not numeric", async () => {
    req.query.page = "not-a-number";

    await getAudit(req, res);

    expect(res.status.mock.calls).toHaveLength(1);
    expect(res.status.mock.calls[0][0]).toBe(400);
    expect(res.send.mock.calls).toHaveLength(1);
  });

  it("then it should get service for each audit that has client", async () => {
    await getAudit(req, res);

    expect(getServiceIdForClientId.mock.calls).toHaveLength(1);
    expect(getServiceIdForClientId.mock.calls[0][0]).toBe("client-1");

    expect(getServiceRaw).toHaveBeenCalledTimes(1);
    expect(getServiceRaw).toHaveBeenCalledWith({
      by: { serviceId: "service-1" },
    });
  });

  it("should include statusChangeReasons in the user model if the status is 0", async () => {
    getUserDetailsById.mockReturnValue({
      id: "user1",
      status: {
        id: 0,
        description: "Dectivated",
      },
    });
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3].user).toStrictEqual({
      formattedLastLogin: "",
      id: "user1",
      status: {
        description: "Dectivated",
        id: 0,
      },
      statusChangeReasons: [
        {
          id: 1,
          new_status: 0,
          old_status: 1,
          reason: "Deactivation reason",
          user_id: "user1",
        },
      ],
    });
  });

  it("should include an empty statusChangeReasons in the user model one is not found", async () => {
    getUserStatusRaw.mockReturnValue(null);
    getUserDetailsById.mockReturnValue({
      id: "user1",
      status: {
        id: 0,
        description: "Dectivated",
      },
    });
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3].user).toStrictEqual({
      formattedLastLogin: "",
      id: "user1",
      status: {
        description: "Dectivated",
        id: 0,
      },
      statusChangeReasons: [],
    });
  });

  it("should pass full req object when getting user", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [],
      numberOfPages: 1,
      numberOfRecords: 0,
    });

    await getAudit(req, res);

    expect(getUserDetailsById.mock.calls).toHaveLength(1);
    expect(getUserDetailsById.mock.calls[0][0]).toBe("user1");
    expect(getUserDetailsById.mock.calls[0][1]).toBe(req);
    expect(getUserDetailsById.mock.calls[0][1]).toHaveProperty("id");
    expect(getUserDetailsById.mock.calls[0][1]).toHaveProperty("params");
  });

  it("should pass full req object for support user-org-deleted event", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          type: "support",
          subType: "user-org-deleted",
          userId: "user1",
          editedUser: "edited-user1",
          editedFields: [{ name: "new_organisation", oldValue: "org-1" }],
          numericIdentifier: "12345",
          textIdentifier: "ABC123",
          timestamp: "2018-01-30T10:30:53.987Z",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });

    await getAudit(req, res);

    const editedUserCall = getUserDetailsById.mock.calls.find(
      (call) => call[0] === "edited-user1",
    );
    expect(editedUserCall).toBeDefined();
    expect(editedUserCall[1]).toBe(req);
    expect(editedUserCall[1]).toHaveProperty("id");
    expect(editedUserCall[1]).toHaveProperty("params");
  });

  it("should pass full req object for support user-org event", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          type: "support",
          subType: "user-org",
          userId: "user1",
          editedUser: "edited-user1",
          editedFields: [{ name: "new_organisation", newValue: "org-1" }],
          timestamp: "2018-01-30T10:30:53.987Z",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });

    await getAudit(req, res);

    const editedUserCall = getUserDetailsById.mock.calls.find(
      (call) => call[0] === "edited-user1",
    );

    expect(editedUserCall).toBeDefined();
    expect(editedUserCall[1]).toBe(req);
    expect(editedUserCall[1]).toHaveProperty("id");
    expect(editedUserCall[1]).toHaveProperty("params");
  });

  it("should pass full req object for support user-org-permission-edited event", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          type: "support",
          subType: "user-org-permission-edited",
          userId: "user1",
          editedUser: "edited-user1",
          editedFields: [
            {
              name: "edited_permission",
              oldValue: 0,
              newValue: 10000,
              organisation: "Test Organisation",
            },
          ],
          timestamp: "2018-01-30T10:30:53.987Z",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });

    await getAudit(req, res);

    const editedUserCall = getUserDetailsById.mock.calls.find(
      (call) => call[0] === "edited-user1",
    );
    expect(editedUserCall).toBeDefined();
    expect(editedUserCall[1]).toBe(req);
    expect(editedUserCall[1]).toHaveProperty("id");
    expect(editedUserCall[1]).toHaveProperty("params");
  });

  it("should return 400 for negative page numbers", async () => {
    req.query.page = "-1";
    await getAudit(req, res);

    expect(res.status.mock.calls).toHaveLength(1);
    expect(res.status.mock.calls[0][0]).toBe(400);
    expect(res.send.mock.calls).toHaveLength(1);
  });

  it("should pass full req object for approver user-org-deleted event", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          type: "approver",
          subType: "user-org-deleted",
          userId: "user1",
          editedUser: "edited-user1",
          meta: JSON.stringify({
            editedFields: [{ name: "new_organisation", oldValue: "org-1" }],
          }),
          numericIdentifier: "12345",
          textIdentifier: "ABC123",
          timestamp: "2018-01-30T10:30:53.987Z",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });

    await getAudit(req, res);

    const editedUserCall = getUserDetailsById.mock.calls.find(
      (call) => call[0] === "edited-user1",
    );
    expect(editedUserCall).toBeDefined();
    expect(editedUserCall[1]).toBe(req);
    expect(editedUserCall[1]).toHaveProperty("id");
    expect(editedUserCall[1]).toHaveProperty("params");
  });

  it("should pass full req object when fetching different audit user", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          type: "sign-in",
          subType: "username-password",
          userId: "different-user",
          timestamp: "2018-01-30T10:30:53.987Z",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });

    await getAudit(req, res);

    const differentUserCall = getUserDetailsById.mock.calls.find(
      (call) => call[0] === "DIFFERENT-USER",
    );
    expect(differentUserCall).toBeDefined();
    expect(differentUserCall[1]).toBe(req);
    expect(differentUserCall[1]).toHaveProperty("id");
    expect(differentUserCall[1]).toHaveProperty("params");
  });

  describe("error handling for dependent function failures", () => {
    it("should handle error when getUserDetailsById throws", async () => {
      getUserDetailsById.mockReset();
      getUserDetailsById.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(getAudit(req, res)).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should handle error when getPageOfUserAudits throws", async () => {
      getPageOfUserAudits.mockReset();
      getPageOfUserAudits.mockRejectedValue(
        new Error("Audit database unavailable"),
      );

      await expect(getAudit(req, res)).rejects.toThrow(
        "Audit database unavailable",
      );
    });

    it("should handle error when getUserStatusRaw throws for deactivated users", async () => {
      getUserDetailsById.mockImplementation(async (userId) => {
        return {
          id: userId,
          firstName: "Test",
          lastName: "User",
          status: {
            id: 0,
            description: "Deactivated",
          },
        };
      });

      getUserStatusRaw.mockReset();
      getUserStatusRaw.mockImplementation(() => {
        throw new Error("Status unavailable");
      });

      await expect(getAudit(req, res)).rejects.toThrow("Status unavailable");
    });

    it("should handle error when getServiceIdForClientId throws", async () => {
      getServiceIdForClientId.mockReset();
      getServiceIdForClientId.mockImplementation(() => {
        throw new Error("Service mapping service down");
      });

      await expect(getAudit(req, res)).rejects.toThrow(
        "Service mapping service down",
      );
    });

    it("should handle error when getServiceRaw throws", async () => {
      getServiceRaw.mockReset();
      getServiceRaw.mockRejectedValue(new Error("Service API unavailable"));

      await expect(getAudit(req, res)).rejects.toThrow(
        "Service API unavailable",
      );
    });

    it("should handle error when getOrganisationLegacyRaw throws", async () => {
      getOrganisationLegacyRaw.mockReset();
      getOrganisationLegacyRaw.mockRejectedValue(
        new Error("Organisation service down"),
      );

      await expect(getAudit(req, res)).rejects.toThrow(
        "Organisation service down",
      );
    });

    it("should handle error when getCachedUserById throws for edited user in audit events", async () => {
      getUserDetailsById.mockReset();
      getUserDetailsById.mockImplementation(async (userId) => {
        if (userId === "edited-user1") {
          throw new Error("Edited user not found in database");
        }
        return {
          id: userId,
          firstName: "Test",
          lastName: "User",
          status: { id: 1, description: "Activated" },
        };
      });

      getPageOfUserAudits.mockResolvedValue({
        audits: [
          {
            type: "support",
            subType: "user-org",
            userId: "user1",
            editedUser: "edited-user1",
            editedFields: [{ name: "new_organisation", newValue: "org-1" }],
            timestamp: "2018-01-30T10:30:53.987Z",
          },
        ],
        numberOfPages: 1,
        numberOfRecords: 1,
      });

      await expect(getAudit(req, res)).rejects.toThrow(
        "Edited user not found in database",
      );
    });

    it("should handle error when getUserOrganisationsWithServicesRaw throws", async () => {
      getUserOrganisationsWithServicesRaw.mockReset();
      getUserOrganisationsWithServicesRaw.mockRejectedValue(
        new Error("User organisations service unavailable"),
      );

      await expect(getAudit(req, res)).rejects.toThrow(
        "User organisations service unavailable",
      );
    });

    it("should handle error in describeAuditEvent when processing complex audit types", async () => {
      getUserDetailsById.mockReset();
      getUserDetailsById.mockImplementation(async (userId) => {
        if (userId === "DIFFERENT-USER") {
          throw new Error("Different user lookup failed");
        }
        return {
          id: userId,
          firstName: "Test",
          lastName: "User",
          status: { id: 1, description: "Activated" },
        };
      });

      getPageOfUserAudits.mockResolvedValue({
        audits: [
          {
            type: "sign-in",
            subType: "username-password",
            userId: "different-user",
            timestamp: "2018-01-30T10:30:53.987Z",
          },
        ],
        numberOfPages: 1,
        numberOfRecords: 1,
      });

      await expect(getAudit(req, res)).rejects.toThrow(
        "Different user lookup failed",
      );
    });

    it("should handle error when cache operations fail for user lookups", async () => {
      getUserDetailsById.mockReset();

      let callCount = 0;
      getUserDetailsById.mockImplementation(async (userId) => {
        callCount++;
        if (callCount === 2) {
          throw new Error("Cache corruption detected");
        }
        return {
          id: userId,
          firstName: "Test",
          lastName: "User",
          status: { id: 1, description: "Activated" },
        };
      });

      getPageOfUserAudits.mockResolvedValue({
        audits: [
          {
            type: "support",
            subType: "user-edit",
            userId: "user1",
            editedUser: "edited-user1",
            editedFields: [{ name: "status", newValue: 0 }],
            reason: "test reason",
            timestamp: "2018-01-30T10:30:53.987Z",
          },
        ],
        numberOfPages: 1,
        numberOfRecords: 1,
      });

      await expect(getAudit(req, res)).rejects.toThrow(
        "Cache corruption detected",
      );
    });
  });
});
