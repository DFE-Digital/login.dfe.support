jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("./../../../src/app/users/utils");
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("./../../../src/infrastructure/applications");
jest.mock("./../../../src/infrastructure/serviceMapping");
jest.mock("./../../../src/infrastructure/audit");
jest.mock("ioredis");

const {
  getUserDetails,
  getUserDetailsById,
} = require("./../../../src/app/users/utils");
const { sendResult } = require("./../../../src/infrastructure/utils");
const {
  getPageOfUserAudits,
  getUserChangeHistory,
} = require("./../../../src/infrastructure/audit");
const {
  getServiceIdForClientId,
} = require("./../../../src/infrastructure/serviceMapping");
const {
  getServiceById,
} = require("./../../../src/infrastructure/applications");
const getAudit = require("./../../../src/app/users/getAudit");

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

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: "user1",
    });
    getUserDetailsById.mockReset();
    getUserDetailsById.mockReturnValue({
      id: "user1",
    });

    sendResult.mockReset();

    getPageOfUserAudits.mockReset();
    getPageOfUserAudits.mockReturnValue({
      audits: [
        {
          type: "sign-in",
          subType: "digipass",
          success: false,
          userId: "user1",
          userEmail: "some.user@test.tester",
          level: "audit",
          message:
            "Successful login attempt for some.user@test.tester (id: user1)",
          timestamp: "2018-01-30T10:31:00.000Z",
          client: "client-1",
        },
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
          client: "client-2",
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
      ],
      numberOfPages: 3,
      numberOfRecords: 56,
    });

    getUserChangeHistory.mockReset();
    getUserChangeHistory.mockReturnValue({
      audits: [
        {
          type: "support",
          subType: "user-edit",
          success: false,
          userId: "user1",
          userEmail: "some.user@test.tester",
          level: "audit",
          message: "Some detailed message",
          timestamp: "2018-01-29T17:31:00.000Z",
        },
      ],
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

    getServiceById.mockReset();
    getServiceById.mockImplementation((serviceId) => {
      return {
        id: serviceId,
        name: serviceId,
        description: serviceId,
      };
    });
  });

  it("then it should send result using audit view", async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls).toHaveLength(1);
    expect(sendResult.mock.calls[0][0]).toBe(req);
    expect(sendResult.mock.calls[0][1]).toBe(res);
    expect(sendResult.mock.calls[0][2]).toBe("users/views/audit");
  });

  it("then it should include csrf token in model", async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      csrfToken: "token",
    });
  });

  it("then it should include user details in model", async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      user: {
        id: "user1",
      },
    });
  });

  it("then it should include number of pages of audits in model", async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      numberOfPages: 3,
    });
  });

  it("then it should include current page of audits in model", async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      audits: [
        {
          timestamp: new Date("2018-01-30T10:31:00.000Z"),
          event: {
            type: "sign-in",
            subType: "digipass",
            description: "Sign-in using a digipass key fob",
          },
          service: {
            id: "service-1",
            name: "service-1",
            description: "service-1",
          },
          organisation: null,
          result: false,
          user: {
            id: "user1",
          },
        },
        {
          timestamp: new Date("2018-01-30T10:30:53.987Z"),
          event: {
            type: "sign-in",
            subType: "username-password",
            description: "Sign-in using email address and password",
          },
          service: {
            id: "service-2",
            name: "service-2",
            description: "service-2",
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
      ],
    });
  });

  it("then it should include page number in model", async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      page: 3,
    });
  });

  it("then it should include total number of records in model", async () => {
    await getAudit(req, res);

    expect(sendResult.mock.calls[0][3]).toMatchObject({
      totalNumberOfResults: 56,
    });
  });

  it("then it should get user details", async () => {
    await getAudit(req, res);

    expect(getUserDetailsById.mock.calls).toHaveLength(1);
    expect(getUserDetailsById.mock.calls[0][0]).toBe(req.params.uid);
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

    expect(getServiceIdForClientId.mock.calls).toHaveLength(2);
    expect(getServiceIdForClientId.mock.calls[0][0]).toBe("client-1");
    expect(getServiceIdForClientId.mock.calls[1][0]).toBe("client-2");

    expect(getServiceById.mock.calls).toHaveLength(2);
    expect(getServiceById.mock.calls[0][0]).toBe("service-1");
    expect(getServiceById.mock.calls[1][0]).toBe("service-2");
  });
});
