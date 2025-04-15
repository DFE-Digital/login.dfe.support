jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/app/users/utils");
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("./../../../src/infrastructure/directories");
jest.mock("./../../../src/infrastructure/serviceMapping");
jest.mock("./../../../src/infrastructure/audit");
jest.mock("./../../../src/infrastructure/applications", () => {
  return {
    getAllServices: jest.fn(),
  };
});
jest.mock("ioredis");

const { getUserDetails } = require("./../../../src/app/users/utils");
const {
  getUserOrganisations,
} = require("./../../../src/infrastructure/organisations");
const {
  getClientIdForServiceId,
} = require("./../../../src/infrastructure/serviceMapping");
const {
  getUserLoginAuditsForService,
} = require("./../../../src/infrastructure/audit");
const {
  getAllServices,
} = require("./../../../src/infrastructure/applications");

const getServices = require("./../../../src/app/users/getServices");

describe("when getting users service details", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      id: "correlationId",
      csrfToken: () => "token",
      accepts: () => ["text/html"],
      user: {
        sub: "user1",
        email: "super.user@unit.test",
      },
      params: {
        uid: "user1",
      },
      session: {
        params: { searchType: "organisations" },
      },
    };

    res = {
      render: jest.fn(),
    };

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: "user1",
    });

    getUserOrganisations.mockReset();
    getUserOrganisations.mockReturnValue([
      {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Big School",
          status: {
            id: 1,
            name: "open",
          },
        },
        role: {
          id: 0,
          name: "End user",
        },
        approvers: [],
        services: [
          {
            id: "83f00ace-f1a0-4338-8784-fa14f5943e5a",
            name: "A good service",
            requestDate: "2018-01-18T10:46:59.385Z",
            status: 1,
          },
          {
            id: "3ff78432-fb20-4ef7-83de-35b3fbb95159",
            name: "Some other service",
            requestDate: "2018-01-18T10:56:59.385Z",
            status: 1,
          },
          {
            id: "db7b12ab-fb0d-42b1-aaff-0e5f108162b9",
            name: "Zzz service",
            requestDate: "2018-01-18T10:56:59.385Z",
            status: 1,
          },
        ],
      },
      {
        organisation: {
          id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
          name: "Small School",
          status: {
            id: 1,
            name: "open",
          },
        },
        role: {
          id: 10000,
          name: "Approver",
        },
        approvers: [],
        services: [
          {
            id: "ae58ed71-4e0f-48d4-8577-4cf6f1b7d299",
            name: "Yet another service",
            requestDate: "2018-01-19T10:46:59.385Z",
            status: 1,
          },
        ],
      },
    ]);

    getClientIdForServiceId.mockReset();
    getClientIdForServiceId.mockImplementation((serviceId) => {
      switch (serviceId) {
        case "83f00ace-f1a0-4338-8784-fa14f5943e5a":
          return "client1";
        case "3ff78432-fb20-4ef7-83de-35b3fbb95159":
          return "client2";
        case "ae58ed71-4e0f-48d4-8577-4cf6f1b7d299":
          return "client3";
        case "db7b12ab-fb0d-42b1-aaff-0e5f108162b9":
          return "client4";
      }
    });

    getUserLoginAuditsForService.mockReset();
    getUserLoginAuditsForService.mockImplementation((userId, clientId) => {
      switch (clientId) {
        case "client1":
          return {
            audits: [
              {
                type: "sign-in",
                subType: "username-password",
                success: true,
                userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
                userEmail: "some.user@test.tester",
                level: "audit",
                message:
                  "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
                timestamp: "2018-02-01T09:00:00.000Z",
              },
            ],
            numberOfPages: 1,
          };
        case "client2":
          return {
            audits: [
              {
                type: "sign-in",
                subType: "username-password",
                success: true,
                userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
                userEmail: "some.user@test.tester",
                level: "audit",
                message:
                  "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
                timestamp: "2018-02-01T10:00:00.000Z",
              },
            ],
            numberOfPages: 1,
          };
        case "client3":
          return {
            audits: [
              {
                type: "sign-in",
                subType: "username-password",
                success: true,
                userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
                userEmail: "some.user@test.tester",
                level: "audit",
                message:
                  "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
                timestamp: "2018-02-01T11:00:00.000Z",
              },
            ],
            numberOfPages: 1,
          };
        case "client4":
          return {
            audits: [
              {
                type: "sign-in",
                subType: "username-password",
                success: true,
                userId: "7a1b077a-d7d4-4b60-83e8-1a1b49849510",
                userEmail: "some.user@test.tester",
                level: "audit",
                message:
                  "Successful login attempt for some.user@test.tester (id: 7a1b077a-d7d4-4b60-83e8-1a1b49849510)",
                timestamp: "2018-02-01T11:00:00.000Z",
              },
            ],
            numberOfPages: 1,
          };
      }
    });
    getAllServices.mockReset();
    getAllServices.mockReturnValue({
      services: [
        {
          id: "83f00ace-f1a0-4338-8784-fa14f5943e5a",
          dateActivated: "10/10/2018",
          name: "A good service",
          status: "active",
          isExternalService: true,
          relyingParty: {
            params: {},
          },
        },
        {
          id: "3ff78432-fb20-4ef7-83de-35b3fbb95159",
          dateActivated: "10/10/2018",
          name: "some other service",
          status: "active",
          isExternalService: true,
          relyingParty: {
            params: {},
          },
        },
        {
          id: "ae58ed71-4e0f-48d4-8577-4cf6f1b7d299",
          dateActivated: "10/10/2018",
          name: "yet another service",
          status: "active",
          isExternalService: true,
          relyingParty: {
            params: {},
          },
        },
        {
          id: "db7b12ab-fb0d-42b1-aaff-0e5f108162b9",
          dateActivated: "10/10/2018",
          name: "Zzz service",
          status: "active",
          isExternalService: true,
          relyingParty: {
            params: {},
          },
        },
      ],
    });
  });

  it("then it should get user details", async () => {
    await getServices(req, res);

    expect(getUserDetails.mock.calls).toHaveLength(1);
    expect(getUserDetails.mock.calls[0][0]).toBe(req);
    expect(res.render.mock.calls[0][1].user).toMatchObject({
      id: "user1",
    });
  });

  it("then it should get organisations mapping for user", async () => {
    await getServices(req, res);

    expect(getUserOrganisations.mock.calls).toHaveLength(1);
    expect(getUserOrganisations.mock.calls[0][0]).toBe("user1");
    expect(getUserOrganisations.mock.calls[0][1]).toBe("correlationId");

    expect(res.render.mock.calls[0][1].organisations).toHaveLength(2);
    // We expect services to be in alphabetical order
    expect(res.render.mock.calls[0][1].organisations[0]).toMatchObject({
      id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
      name: "Big School",
      status: {
        id: 1,
        name: "open",
      },
      services: [
        {
          id: "83f00ace-f1a0-4338-8784-fa14f5943e5a",
          name: "A good service",
          userType: {
            id: 0,
            name: "End user",
          },
          grantedAccessOn: new Date("2018-01-18T10:46:59.385Z"),
        },
        {
          id: "3ff78432-fb20-4ef7-83de-35b3fbb95159",
          name: "Some other service",
          userType: {
            id: 0,
            name: "End user",
          },
          grantedAccessOn: new Date("2018-01-18T10:56:59.385Z"),
        },
        {
          id: "db7b12ab-fb0d-42b1-aaff-0e5f108162b9",
          name: "Zzz service",
          userType: {
            id: 0,
            name: "End user",
          },
          grantedAccessOn: new Date("2018-01-18T10:56:59.385Z"),
        },
      ],
    });
    expect(res.render.mock.calls[0][1].organisations[1]).toMatchObject({
      id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
      name: "Small School",
      status: {
        id: 1,
        name: "open",
      },
      services: [
        {
          id: "ae58ed71-4e0f-48d4-8577-4cf6f1b7d299",
          name: "Yet another service",
          userType: {
            id: 10000,
            name: "Approver",
          },
          grantedAccessOn: new Date("2018-01-19T10:46:59.385Z"),
        },
      ],
    });
  });
});
