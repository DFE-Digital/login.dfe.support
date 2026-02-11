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
const { getUserStatusRaw } = require("login.dfe.api-client/users");

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
    getUserDetailsById.mockReturnValue({
      id: "user1",
      status: {
        id: 1,
        description: "Activated",
      },
    });

    sendResult.mockReset();

    getPageOfUserAudits.mockReset();
    getPageOfUserAudits.mockReturnValue({
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
          organisation: undefined,
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
    getPageOfUserAudits.mockReturnValue({
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

  // This test should be rewritten to be a paramaterised test
  it("should leave a number of subtypes of message unchanged", async () => {
    getPageOfUserAudits.mockReturnValue({
      audits: [
        createSimpleAuditRecord(
          "service",
          "service-request-approved",
          "email@email.com approved service request for john.doe@email.com",
        ),
        createSimpleAuditRecord(
          "sub-service",
          "sub-service-request-approved",
          "email@email.com approved sub-service request for john.doe@email.com",
        ),
        createSimpleAuditRecord(
          "manage",
          "organisation-request-approved",
          "email@email.com approved organisation request for john.doe@email.com",
        ),
        createSimpleAuditRecord(
          "service",
          "service-request-rejected",
          "email@email.com rejected service request for john.doe@email.com",
        ),
        createSimpleAuditRecord(
          "sub-service",
          "sub-service-request-rejected",
          "email@email.com rejected sub-service request for john.doe@email.com",
        ),
        createSimpleAuditRecord(
          "manage",
          "organisation-request-rejected",
          "email@email.com rejected organisation request for john.doe@email.com",
        ),
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
      ],
      numberOfPages: 3,
      numberOfRecords: 56,
    });
    await getAudit(req, res);

    const auditRows = sendResult.mock.calls[0][3].audits;
    expect(auditRows[0].event.description).toBe(
      "email@email.com approved service request for john.doe@email.com",
    );
    expect(auditRows[1].event.description).toBe(
      "email@email.com approved sub-service request for john.doe@email.com",
    );
    expect(auditRows[2].event.description).toBe(
      "email@email.com approved organisation request for john.doe@email.com",
    );
    expect(auditRows[3].event.description).toBe(
      "email@email.com rejected service request for john.doe@email.com",
    );
    expect(auditRows[4].event.description).toBe(
      "email@email.com rejected sub-service request for john.doe@email.com",
    );
    expect(auditRows[5].event.description).toBe(
      "email@email.com rejected organisation request for john.doe@email.com",
    );
    expect(auditRows[6].event.description).toBe(
      "some.user@test.tester added service Test Service for user another.user@example.com",
    );
    expect(auditRows[7].event.description).toBe(
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
});
