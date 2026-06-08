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
jest.mock("login.dfe.api-client/invitations", () => ({
  getInvitationOrganisationsRaw: jest.fn(),
}));

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
const {
  getInvitationOrganisationsRaw,
} = require("login.dfe.api-client/invitations");

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

    getInvitationOrganisationsRaw.mockReset();
    getInvitationOrganisationsRaw.mockResolvedValue([]);

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

  it.each([
    [
      "service",
      "service-request-approved",
      "email@email.com approved service request for john.doe@email.com",
    ],
    [
      "sub-service",
      "sub-service-request-approved",
      "email@email.com approved sub-service request for john.doe@email.com",
    ],
    [
      "manage",
      "organisation-request-approved",
      "email@email.com approved organisation request for john.doe@email.com",
    ],
    [
      "service",
      "service-request-rejected",
      "email@email.com rejected service request for john.doe@email.com",
    ],
    [
      "sub-service",
      "sub-service-request-rejected",
      "email@email.com rejected sub-service request for john.doe@email.com",
    ],
    [
      "manage",
      "organisation-request-rejected",
      "email@email.com rejected organisation request for john.doe@email.com",
    ],
    [
      "manage",
      "user-service-added",
      "some.user@test.tester added service Test Service for user another.user@example.com",
    ],
    [
      "manage",
      "user-service-deleted",
      "some.user@test.tester removed service Test Service for user another.user@example.com",
    ],
    [
      "organisation",
      "access-request",
      "some.user@test.tester requested organisation access",
    ],
    [
      "services",
      "access-request",
      "some.user@test.tester requested service access",
    ],
    [
      "support",
      "service-create",
      "some.user@test.tester created Check A Thing service",
    ],
    [
      "manage",
      "service-config-updated",
      "some.user@test.tester updated service configuration",
      "policy-created",
      "user@unit.test added a policy with name 'Test policy'",
    ],
    [
      "manage",
      "policy-condition-added",
      "some.user@test.tester added 'organisation.ukprn' policy condition",
    ],
    [
      "manage",
      "policy-role-added",
      "some.user@test.tester added a policy role with name 'MyRole'",
    ],
    [
      "manage",
      "policy-removed",
      "user@unit.test removed a policy with name 'Test policy'",
    ],
    [
      "manage",
      "policy-condition-removed",
      "some.user@test.tester removed 'organisation.ukprn' policy condition",
    ],
    [
      "manage",
      "policy-role-removed",
      "some.user@test.tester removed a policy role with name 'MyRole'",
    ],
  ])("should convert %s / %s", async (type, subType, message) => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [createSimpleAuditRecord(type, subType, message)],
      numberOfPages: 3,
      numberOfRecords: 56,
    });
    await getAudit(req, res);

    const auditRows = sendResult.mock.calls[0][3].audits;
    expect(auditRows[0].event.description).toBe(message);
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

  it("should pass isInvitation: true to the view model for invited users", async () => {
    req.params.uid = "inv-user1";
    getUserDetailsById.mockImplementation(async () => ({
      id: "inv-user1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      lastLogin: null,
      status: { id: -1, description: "Invited" },
      createdAt: "2025-01-01T00:00:00.000Z",
    }));
    getPageOfUserAudits.mockResolvedValue({
      audits: [],
      numberOfPages: 1,
      numberOfRecords: 0,
    });
    await getAudit(req, res);
    expect(sendResult.mock.calls[0][3]).toMatchObject({ isInvitation: true });
  });

  it("should inject a fallback entry when invited user has no audit records", async () => {
    req.params.uid = "inv-user1";
    req.query.page = 1;
    getUserDetailsById.mockImplementation(async () => ({
      id: "inv-user1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      lastLogin: null,
      status: { id: -1, description: "Invited" },
      createdAt: "2025-01-01T00:00:00.000Z",
    }));
    getPageOfUserAudits.mockResolvedValue({
      audits: [],
      numberOfPages: 1,
      numberOfRecords: 0,
    });
    await getAudit(req, res);
    const auditRows = sendResult.mock.calls[0][3].audits;
    expect(auditRows).toHaveLength(1);
    expect(auditRows[0].event.description).toBe("Invitation created");
  });

  it("should display clean message for resent-invitation events (no IDs)", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          ...createSimpleAuditRecord(
            "support",
            "resent-invitation",
            "raw msg (id: UUID)",
          ),
          userEmail: "agent@edu.gov.uk",
          invitedUserEmail: "user@example.com",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const desc = sendResult.mock.calls[0][3].audits[0].event.description;
    expect(desc).toBe(
      "agent@edu.gov.uk resent invitation email to user@example.com",
    );
    expect(desc).not.toMatch(/\bid:/);
  });

  it("should display audit.message for support/invite-created (not a hardcoded string)", async () => {
    const msg = `support invited someone@example.com to Test Org (id: org-1) (id: inv-abc)`;
    getPageOfUserAudits.mockResolvedValue({
      audits: [createSimpleAuditRecord("support", "invite-created", msg)],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const auditRows = sendResult.mock.calls[0][3].audits;
    expect(auditRows[0].event.description).toBe(msg);
  });

  it("should display metadata-based message for approver/user-org-permission-edited (no IDs)", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          ...createSimpleAuditRecord(
            "approver",
            "user-org-permission-edited",
            "raw (id: UUID)",
          ),
          userEmail: "agent@edu.gov.uk",
          editedUserEmail: "user@example.com",
          organisationName: "Test School",
          editedFields: [{ name: "edited_permission", newValue: "Approver" }],
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const desc = sendResult.mock.calls[0][3].audits[0].event.description;
    expect(desc).toBe(
      "agent@edu.gov.uk edited permission to Approver for user@example.com in Test School",
    );
    expect(desc).not.toMatch(/\bid:/);
  });

  it.each([["support"], ["approver"]])(
    "should omit legacyID from %s/user-org-deleted when identifiers are absent",
    async (type) => {
      getPageOfUserAudits.mockResolvedValue({
        audits: [
          {
            ...createSimpleAuditRecord(type, "user-org-deleted", "raw msg"),
            editedFields: [
              {
                name: "new_organisation",
                oldValue: "org-1",
                newValue: undefined,
              },
            ],
            meta: JSON.stringify({
              editedFields: [
                {
                  name: "new_organisation",
                  oldValue: "org-1",
                  newValue: undefined,
                },
              ],
              editedUser: "edited-user1",
            }),
          },
        ],
        numberOfPages: 1,
        numberOfRecords: 1,
      });
      await getAudit(req, res);
      const auditRows = sendResult.mock.calls[0][3].audits;
      expect(auditRows[0].event.description).not.toContain("legacyID");
      expect(auditRows[0].event.description).not.toContain("undefined");
    },
  );

  it("should display clean message for support/user-invite-org (no IDs)", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          ...createSimpleAuditRecord(
            "support",
            "user-invite-org",
            "raw msg (id: UUID)",
          ),
          userEmail: "agent@edu.gov.uk",
          invitedUserEmail: "user@example.com",
          organisationName: "Test School",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const desc = sendResult.mock.calls[0][3].audits[0].event.description;
    expect(desc).toBe(
      "agent@edu.gov.uk invited user@example.com to Test School",
    );
    expect(desc).not.toMatch(/\bid:/);
  });

  it("should pass an empty array to the view when getInvitationOrganisationsRaw returns null", async () => {
    req.params.uid = "inv-user1";
    getUserDetailsById.mockImplementation(async () => ({
      id: "inv-user1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      lastLogin: null,
      status: { id: -1, description: "Invited" },
      createdAt: "2025-01-01T00:00:00.000Z",
    }));
    getPageOfUserAudits.mockResolvedValue({
      audits: [],
      numberOfPages: 1,
      numberOfRecords: 0,
    });
    getInvitationOrganisationsRaw.mockResolvedValue(null);
    await getAudit(req, res);
    expect(sendResult.mock.calls[0][3].organisations).toEqual([]);
  });

  it("should use getInvitationOrganisationsRaw (not getUserOrganisationsWithServicesRaw) for invited users", async () => {
    req.params.uid = "inv-user1";
    getUserDetailsById.mockImplementation(async () => ({
      id: "inv-user1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      lastLogin: null,
      status: { id: -1, description: "Invited" },
      createdAt: "2025-01-01T00:00:00.000Z",
    }));
    getPageOfUserAudits.mockResolvedValue({
      audits: [],
      numberOfPages: 1,
      numberOfRecords: 0,
    });
    await getAudit(req, res);
    expect(getInvitationOrganisationsRaw).toHaveBeenCalledWith({
      invitationId: "user1",
    });
    expect(getUserOrganisationsWithServicesRaw).not.toHaveBeenCalled();
  });

  it("should display clean message for support/user-invited with org (no IDs)", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          ...createSimpleAuditRecord(
            "support",
            "user-invited",
            "raw msg with (id: UUID)",
          ),
          userEmail: "agent@edu.gov.uk",
          invitedUserEmail: "user@example.com",
          organisationName: "Test School",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const desc = sendResult.mock.calls[0][3].audits[0].event.description;
    expect(desc).toBe(
      "agent@edu.gov.uk invited user@example.com to Test School from support console",
    );
    expect(desc).not.toMatch(/\bid:/);
  });

  it("should display clean message for support/user-invited without org", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          ...createSimpleAuditRecord("support", "user-invited", "raw"),
          userEmail: "agent@edu.gov.uk",
          invitedUserEmail: "user@example.com",
          organisationName: undefined,
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const desc = sendResult.mock.calls[0][3].audits[0].event.description;
    expect(desc).toBe(
      "agent@edu.gov.uk invited user@example.com from support console",
    );
  });

  it("should display clean message for approver/invite-created with org (no IDs)", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          ...createSimpleAuditRecord(
            "approver",
            "invite-created",
            "raw (id: UUID)",
          ),
          userEmail: "agent@edu.gov.uk",
          invitedUserEmail: "user@example.com",
          organisationName: "Test School",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const desc = sendResult.mock.calls[0][3].audits[0].event.description;
    expect(desc).toBe(
      "agent@edu.gov.uk invited user@example.com to Test School",
    );
    expect(desc).not.toMatch(/\bid:/);
  });

  it("falls back to the stored message for historical approver/invite-created lacking userEmail (no undefined agent)", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          type: "approver",
          subType: "invite-created",
          userId: "approver-1",
          editedUser: "inv-abc",
          level: "audit",
          message: "legacy invite-created message",
          timestamp: "2025-01-29T17:31:00.000Z",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const desc = sendResult.mock.calls[0][3].audits[0].event.description;
    expect(desc).toBe("legacy invite-created message");
    expect(desc).not.toContain("undefined");
  });

  it("should display clean message for approver/user-invited with invitedUserEmail present", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          ...createSimpleAuditRecord(
            "approver",
            "user-invited",
            "raw msg (id: UUID)",
          ),
          userEmail: "agent@edu.gov.uk",
          invitedUserEmail: "user@example.com",
          invitedUser: "inv-abc",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const desc = sendResult.mock.calls[0][3].audits[0].event.description;
    expect(desc).toBe("agent@edu.gov.uk invited user@example.com");
    expect(desc).not.toMatch(/\bid:/);
  });

  it("resolves invited email via lookup for approver/user-invited lacking invitedUserEmail", async () => {
    getUserDetailsById.mockImplementation(async (userId) => ({
      id: userId,
      email: userId === "inv-abc" ? "invited@example.com" : "agent@edu.gov.uk",
      firstName: "Test",
      lastName: "User",
      status: { id: -1, description: "Invited" },
    }));
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          type: "approver",
          subType: "user-invited",
          userId: "user1",
          userEmail: "agent@edu.gov.uk",
          invitedUser: "inv-abc",
          level: "audit",
          message: "fallback message",
          timestamp: "2025-01-29T17:31:00.000Z",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const desc = sendResult.mock.calls[0][3].audits[0].event.description;
    expect(desc).toBe("agent@edu.gov.uk invited invited@example.com");
  });

  it("falls back to audit.message for approver/user-invited when userEmail is missing", async () => {
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          type: "approver",
          subType: "user-invited",
          userId: "user1",
          invitedUser: "inv-abc",
          level: "audit",
          message: "legacy approver/user-invited message with org info",
          timestamp: "2025-01-29T17:31:00.000Z",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const desc = sendResult.mock.calls[0][3].audits[0].event.description;
    expect(desc).toBe("legacy approver/user-invited message with org info");
    expect(desc).not.toContain("undefined");
  });

  it("falls back to audit.message for approver/user-invited when invitedEmail cannot be resolved", async () => {
    getUserDetailsById.mockImplementation(async (userId) => ({
      id: userId,
      email: "agent@edu.gov.uk",
      firstName: "Test",
      lastName: "User",
      status: { id: 1, description: "Activated" },
    }));
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          type: "approver",
          subType: "user-invited",
          userId: "user1",
          userEmail: "agent@edu.gov.uk",
          // no invitedUserEmail, no invitedUser
          level: "audit",
          message: "historical message with full context",
          timestamp: "2025-01-29T17:31:00.000Z",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const desc = sendResult.mock.calls[0][3].audits[0].event.description;
    expect(desc).toBe("historical message with full context");
    expect(desc).not.toContain("undefined");
  });

  it("resolves invited email via lookup for historical support/resent-invitation lacking invitedUserEmail", async () => {
    getUserDetailsById.mockImplementation(async (userId) => ({
      id: userId,
      email: userId === "inv-abc" ? "invited@example.com" : "other@example.com",
      firstName: "Test",
      lastName: "User",
      status: { id: 1, description: "Activated" },
    }));
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          type: "support",
          subType: "resent-invitation",
          userId: "agent-1",
          userEmail: "agent@edu.gov.uk",
          editedUser: "inv-abc",
          level: "audit",
          message: "legacy resent (id: UUID)",
          timestamp: "2025-01-29T17:31:00.000Z",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const desc = sendResult.mock.calls[0][3].audits[0].event.description;
    expect(desc).toBe(
      "agent@edu.gov.uk resent invitation email to invited@example.com",
    );
    expect(desc).not.toContain("undefined");
    expect(desc).not.toMatch(/\bid:/);
  });

  it("resolves edited email and omits org for historical approver/user-org-permission-edited lacking metadata", async () => {
    getUserDetailsById.mockImplementation(async (userId) => ({
      id: userId,
      email: userId === "active-1" ? "edited@example.com" : "other@example.com",
      firstName: "Test",
      lastName: "User",
      status: { id: 1, description: "Activated" },
    }));
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          type: "approver",
          subType: "user-org-permission-edited",
          userId: "approver-1",
          userEmail: "agent@edu.gov.uk",
          editedUser: "active-1",
          editedFields: [{ name: "edited_permission", newValue: "Approver" }],
          level: "audit",
          message: "legacy permission (id: UUID)",
          timestamp: "2025-01-29T17:31:00.000Z",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const desc = sendResult.mock.calls[0][3].audits[0].event.description;
    expect(desc).toBe(
      "agent@edu.gov.uk edited permission to Approver for edited@example.com",
    );
    expect(desc).not.toContain("undefined");
    expect(desc).not.toMatch(/\bid:/);
  });

  it("resolves org from invitedOrganisation id for historical support/user-invite-org lacking organisationName", async () => {
    getOrganisationLegacyRaw.mockResolvedValue({
      id: "org-99",
      name: "Resolved Org",
    });
    getPageOfUserAudits.mockResolvedValue({
      audits: [
        {
          type: "support",
          subType: "user-invite-org",
          userId: "agent-1",
          userEmail: "agent@edu.gov.uk",
          invitedUserEmail: "user@example.com",
          invitedOrganisation: "org-99",
          editedUser: "inv-abc",
          level: "audit",
          message: "legacy add-org (id: UUID)",
          timestamp: "2025-01-29T17:31:00.000Z",
        },
      ],
      numberOfPages: 1,
      numberOfRecords: 1,
    });
    await getAudit(req, res);
    const desc = sendResult.mock.calls[0][3].audits[0].event.description;
    expect(desc).toBe(
      "agent@edu.gov.uk invited user@example.com to Resolved Org",
    );
    expect(desc).not.toContain("undefined");
    expect(desc).not.toMatch(/\bid:/);
  });

  describe("synthetic 'Invitation created' fallback event", () => {
    const inviteUserMock = {
      id: "inv-user1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      lastLogin: null,
      status: { id: -1, description: "Invited" },
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    beforeEach(() => {
      req.params.uid = "inv-user1";
      req.query.page = 1;
      getUserDetailsById.mockImplementation(async () => inviteUserMock);
      getInvitationOrganisationsRaw.mockResolvedValue([]);
    });

    it("fires when: invitation user, page 1, no invite-type events, single page, createdAt present", async () => {
      getPageOfUserAudits.mockResolvedValue({
        audits: [
          {
            type: "support",
            subType: "user-view",
            userId: "inv-user1",
            level: "audit",
            message: "Support agent viewed this user",
            timestamp: "2025-03-01T10:00:00.000Z",
          },
        ],
        numberOfPages: 1,
        numberOfRecords: 1,
      });

      await getAudit(req, res);

      const auditRows = sendResult.mock.calls[0][3].audits;
      const syntheticEvent = auditRows.find(
        (a) => a.event.description === "Invitation created",
      );
      expect(syntheticEvent).toBeDefined();
      expect(syntheticEvent.event.type).toBe("invitation-code");
      expect(syntheticEvent.event.subType).toBe("post-invitation");
      expect(syntheticEvent.result).toBe(true);
      expect(syntheticEvent.service).toBeNull();
      expect(syntheticEvent.organisation).toBeNull();
      expect(syntheticEvent.user).toEqual({ name: "" });
      expect(syntheticEvent.timestamp).toEqual(
        new Date("2025-01-01T00:00:00.000Z"),
      );
    });

    it("does NOT fire when: invitation user has an invite-created event in audits", async () => {
      getPageOfUserAudits.mockResolvedValue({
        audits: [
          {
            type: "approver",
            subType: "invite-created",
            userId: "approver-1",
            userEmail: "approver@edu.gov.uk",
            invitedUserEmail: "jane@example.com",
            organisationName: "Test Org",
            level: "audit",
            message: "approver@edu.gov.uk invited jane@example.com to Test Org",
            timestamp: "2025-01-01T00:00:00.000Z",
          },
        ],
        numberOfPages: 1,
        numberOfRecords: 1,
      });

      await getAudit(req, res);

      const auditRows = sendResult.mock.calls[0][3].audits;
      const syntheticEvent = auditRows.find(
        (a) => a.event.description === "Invitation created",
      );
      expect(syntheticEvent).toBeUndefined();
    });

    it("does NOT fire when: invitation user has a user-invited event in audits", async () => {
      getPageOfUserAudits.mockResolvedValue({
        audits: [
          {
            type: "approver",
            subType: "user-invited",
            userId: "approver-1",
            userEmail: "approver@edu.gov.uk",
            invitedUserEmail: "jane@example.com",
            invitedUser: "inv-user1",
            level: "audit",
            message: "approver@edu.gov.uk invited jane@example.com",
            timestamp: "2025-01-01T00:00:00.000Z",
          },
        ],
        numberOfPages: 1,
        numberOfRecords: 1,
      });

      await getAudit(req, res);

      const auditRows = sendResult.mock.calls[0][3].audits;
      const syntheticEvent = auditRows.find(
        (a) => a.event.description === "Invitation created",
      );
      expect(syntheticEvent).toBeUndefined();
    });

    it("does NOT fire when: multiple pages exist (numberOfPages > 1) even if no invite event on page 1", async () => {
      getPageOfUserAudits.mockResolvedValue({
        audits: [
          {
            type: "support",
            subType: "user-view",
            userId: "inv-user1",
            level: "audit",
            message: "Support agent viewed this user",
            timestamp: "2025-03-01T10:00:00.000Z",
          },
        ],
        numberOfPages: 2,
        numberOfRecords: 25,
      });

      await getAudit(req, res);

      const auditRows = sendResult.mock.calls[0][3].audits;
      const syntheticEvent = auditRows.find(
        (a) => a.event.description === "Invitation created",
      );
      expect(syntheticEvent).toBeUndefined();
    });

    it("does NOT fire when: not an invitation user (regular uid not starting with inv-)", async () => {
      req.params.uid = "user1";
      getUserDetailsById.mockImplementation(async (userId) => ({
        id: userId,
        firstName: "Test",
        lastName: "User",
        status: { id: 1, description: "Activated" },
      }));
      getPageOfUserAudits.mockResolvedValue({
        audits: [],
        numberOfPages: 1,
        numberOfRecords: 0,
      });

      await getAudit(req, res);

      const auditRows = sendResult.mock.calls[0][3].audits;
      const syntheticEvent = auditRows.find(
        (a) => a.event.description === "Invitation created",
      );
      expect(syntheticEvent).toBeUndefined();
    });

    it("does NOT fire when: user.createdAt is absent/undefined", async () => {
      getUserDetailsById.mockImplementation(async () => ({
        ...inviteUserMock,
        createdAt: undefined,
      }));
      getPageOfUserAudits.mockResolvedValue({
        audits: [],
        numberOfPages: 1,
        numberOfRecords: 0,
      });

      await getAudit(req, res);

      const auditRows = sendResult.mock.calls[0][3].audits;
      const syntheticEvent = auditRows.find(
        (a) => a.event.description === "Invitation created",
      );
      expect(syntheticEvent).toBeUndefined();
    });

    it("does NOT fire when: page is greater than 1", async () => {
      req.params.uid = "inv-abc123";
      req.query = { page: "2" };
      getUserDetailsById.mockResolvedValue({
        id: "inv-abc123",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: { id: -1, description: "Invited" },
        loginsInPast12Months: { successful: 0 },
        lastLogin: null,
        createdAt: "2025-01-15T10:00:00.000Z",
      });
      getPageOfUserAudits.mockResolvedValue({
        audits: [],
        numberOfRecords: 0,
        numberOfPages: 1,
      });
      await getAudit(req, res);
      const audits = sendResult.mock.calls[0][3].audits;
      expect(audits.some((a) => a.event.subType === "post-invitation")).toBe(
        false,
      );
    });

    it("increments totalNumberOfResults by 1 when synthetic event is added", async () => {
      getPageOfUserAudits.mockResolvedValue({
        audits: [
          {
            type: "support",
            subType: "user-view",
            userId: "inv-user1",
            level: "audit",
            message: "Support agent viewed this user",
            timestamp: "2025-03-01T10:00:00.000Z",
          },
        ],
        numberOfPages: 1,
        numberOfRecords: 1,
      });

      await getAudit(req, res);

      expect(sendResult.mock.calls[0][3].totalNumberOfResults).toBe(2);
    });

    it("does NOT increment totalNumberOfResults when synthetic event is not added", async () => {
      getPageOfUserAudits.mockResolvedValue({
        audits: [
          {
            type: "approver",
            subType: "invite-created",
            userId: "approver-1",
            userEmail: "approver@edu.gov.uk",
            invitedUserEmail: "jane@example.com",
            level: "audit",
            message: "approver@edu.gov.uk invited jane@example.com",
            timestamp: "2025-01-01T00:00:00.000Z",
          },
        ],
        numberOfPages: 1,
        numberOfRecords: 1,
      });

      await getAudit(req, res);

      expect(sendResult.mock.calls[0][3].totalNumberOfResults).toBe(1);
    });
  });

  describe("approver/user-org-deleted without editedFields", () => {
    it("shows readable description when editedFields is absent but organisationId is set", async () => {
      getOrganisationLegacyRaw.mockResolvedValue({ name: "Test School" });
      getUserDetailsById.mockResolvedValue({
        id: "user-abc",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        status: { id: 1 },
        loginsInPast12Months: { successful: 0 },
        lastLogin: null,
      });
      getPageOfUserAudits.mockResolvedValue({
        audits: [
          {
            id: "audit-1",
            type: "approver",
            subType: "user-org-deleted",
            userId: "user-abc",
            message:
              "someone@example.com removed org Test School for user jane@example.com numeric Identifier and textIdentifier(null)",
            timestamp: "2026-06-01T10:00:00.000Z",
            organisationId: "org-uuid-123",
            editedFields: undefined,
            editedUser: "user-abc",
            success: true,
          },
        ],
        numberOfPages: 1,
        numberOfRecords: 1,
      });

      await getAudit(req, res);

      const audits = sendResult.mock.calls[0][3].audits;
      expect(audits[0].event.description).toBe(
        "Deleted organisation: Test School for user Jane Doe",
      );
      expect(audits[0].event.description).not.toContain("null");
      expect(getOrganisationLegacyRaw).toHaveBeenCalledWith({
        organisationId: "org-uuid-123",
      });
    });
  });
});
