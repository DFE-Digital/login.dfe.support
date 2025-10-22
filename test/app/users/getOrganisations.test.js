jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/app/users/utils");
jest.mock("./../../../src/infrastructure/organisations");
jest.mock("./../../../src/infrastructure/directories");
jest.mock("./../../../src/infrastructure/serviceMapping");
jest.mock("./../../../src/infrastructure/audit");
jest.mock("ioredis");
jest.mock("login.dfe.api-client/users");

const { getUserDetailsById } = require("../../../src/app/users/utils");
const {
  getPendingRequestsRaw,
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");
const {
  getUsersByIdV2,
  getUserStatus,
} = require("../../../src/infrastructure/directories");
const {
  getClientIdForServiceId,
} = require("../../../src/infrastructure/serviceMapping");
const getOrganisations = require("../../../src/app/users/getOrganisations");

describe("when getting users organisation details", () => {
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

    getUserDetailsById.mockReset();
    getUserDetailsById.mockReturnValue({
      id: "user1",
      status: {
        id: 1,
        description: "Activated",
      },
    });

    getUserStatus.mockReset();
    getUserStatus.mockReturnValue({
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

    getUserOrganisationsWithServicesRaw.mockReset();
    getUserOrganisationsWithServicesRaw.mockReturnValue([
      {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
        approvers: ["user1"],
      },
      {
        organisation: {
          id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
          name: "Little Tiny School",
        },
        approvers: ["user1"],
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
      }
    });

    getUsersByIdV2.mockReset();
    getUsersByIdV2.mockReturnValue([
      {
        sub: "user1",
        given_name: "User",
        family_name: "One",
        email: "user.one@unit.tests",
        status: 1,
      },
      {
        sub: "user6",
        given_name: "User",
        family_name: "Six",
        email: "user.six@unit.tests",
        status: 1,
      },
      {
        sub: "user11",
        given_name: "User",
        family_name: "Eleven",
        email: "user.eleven@unit.tests",
        status: 1,
      },
    ]);
    getPendingRequestsRaw.mockReset();
    getPendingRequestsRaw.mockReturnValue([
      {
        id: "requestId",
        org_id: "organisationId",
        org_name: "organisationName",
        user_id: "user2",
        status: {
          id: 0,
          name: "pending",
        },
        created_date: "2019-08-12",
      },
    ]);
  });

  it("then it should get user details", async () => {
    await getOrganisations(req, res);

    expect(getUserDetailsById.mock.calls).toHaveLength(1);
    expect(getUserDetailsById.mock.calls[0][0]).toBe("user1");
    expect(getUserDetailsById.mock.calls[0][1]).toBe(req);
    expect(res.render.mock.calls[0][1].user).toMatchObject({
      id: "user1",
    });
  });

  it("then it should include '/organisations' as the backLink in model", async () => {
    await getOrganisations(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: "/organisations",
    });
  });

  it("should set the backlink to /users if the search type session param is not organisations", async () => {
    req.session.params.searchType = "/users";
    await getOrganisations(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      backLink: "/users",
    });
  });

  it("then it should get organisations and requests mapping for user", async () => {
    await getOrganisations(req, res);

    expect(getUserOrganisationsWithServicesRaw.mock.calls).toHaveLength(1);
    expect(getUserOrganisationsWithServicesRaw).toHaveBeenCalledWith({
      userId: "user1",
    });

    expect(getPendingRequestsRaw.mock.calls).toHaveLength(1);
    expect(getPendingRequestsRaw).toHaveBeenCalledWith({ userId: "user1" });

    expect(res.render.mock.calls[0][1].organisations).toHaveLength(3);
    expect(res.render.mock.calls[0][1].organisations[0]).toMatchObject({
      id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
      name: "Great Big School",
    });
    expect(res.render.mock.calls[0][1].organisations[1]).toMatchObject({
      id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
      name: "Little Tiny School",
    });
    expect(res.render.mock.calls[0][1].organisations[2]).toMatchObject({
      id: "organisationId",
      name: "organisationName",
      requestId: "requestId",
    });
  });

  it("should filter out users with a deactivated account", async () => {
    // Given
    getUsersByIdV2.mockReturnValue([
      {
        sub: "user1",
        given_name: "User",
        family_name: "One",
        email: "user.one@unit.tests",
        status: 1,
      },
      {
        sub: "user6",
        given_name: "User",
        family_name: "Six",
        email: "user.six@unit.tests",
        status: 1,
      },
      {
        sub: "user11",
        given_name: "User",
        family_name: "Eleven",
        email: "user.eleven@unit.tests",
        status: 0,
      },
    ]);

    getUserOrganisationsWithServicesRaw.mockReturnValue([
      {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
        approvers: ["user1", "user6"],
      },
      {
        organisation: {
          id: "fe68a9f4-a995-4d74-aa4b-e39e0e88c15d",
          name: "Little Tiny School",
        },
        approvers: ["user1", "user11"],
      },
    ]);

    // When
    await getOrganisations(req, res);

    // Then
    expect(getUserDetailsById.mock.calls).toHaveLength(1);
    expect(getUserDetailsById.mock.calls[0][0]).toBe("user1");
    expect(getUserDetailsById.mock.calls[0][1]).toBe(req);
    // Organisations[0] is Great Big School
    expect(
      res.render.mock.calls[0][1].organisations[0].approvers,
    ).toMatchObject([
      {
        email: "user.one@unit.tests",
        family_name: "One",
        given_name: "User",
        status: 1,
        sub: "user1",
      },
      {
        sub: "user6",
        given_name: "User",
        family_name: "Six",
        email: "user.six@unit.tests",
        status: 1,
      },
    ]);
    // Organisations[1] is Little Tiny School
    expect(
      res.render.mock.calls[0][1].organisations[1].approvers,
    ).toMatchObject([
      {
        email: "user.one@unit.tests",
        family_name: "One",
        given_name: "User",
        status: 1,
        sub: "user1",
      },
    ]);
  });

  it("should return an empty approvers section if the organisation does not have any approvers", async () => {
    // Test might sound pointless, but getApproverDetails defines what happens if there are no approvers
    // so we need a unit test to verify it's working as intended

    // Given
    getUserOrganisationsWithServicesRaw.mockReturnValue([
      {
        organisation: {
          id: "88a1ed39-5a98-43da-b66e-78e564ea72b0",
          name: "Great Big School",
        },
        approvers: [],
      },
    ]);

    // When
    await getOrganisations(req, res);

    // Then
    expect(getUserDetailsById.mock.calls).toHaveLength(1);
    expect(getUserDetailsById.mock.calls[0][0]).toBe("user1");
    expect(getUserDetailsById.mock.calls[0][1]).toBe(req);
    expect(getUsersByIdV2.mock.calls).toHaveLength(0);

    // Organisations[0] is Great Big School
    expect(
      res.render.mock.calls[0][1].organisations[0].approvers,
    ).toMatchObject([]);
  });

  it("should include statusChangeReasons in the user model if the status is 0", async () => {
    getUserDetailsById.mockReturnValue({
      id: "user1",
      status: {
        id: 0,
        description: "Dectivated",
      },
    });
    await getOrganisations(req, res);

    expect(res.render.mock.calls[0][1].user).toStrictEqual({
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
    getUserStatus.mockReturnValue(null);
    getUserDetailsById.mockReturnValue({
      id: "user1",
      status: {
        id: 0,
        description: "Dectivated",
      },
    });
    await getOrganisations(req, res);

    expect(res.render.mock.calls[0][1].user).toStrictEqual({
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
