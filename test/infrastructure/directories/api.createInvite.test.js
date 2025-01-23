jest.mock("login.dfe.async-retry");
jest.mock("login.dfe.jwt-strategies");
jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory({
    directories: {
      type: "api",
      service: {
        url: "http://directories.test",
      },
    },
  }),
);

const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");
const { createInvite } = require("../../../src/infrastructure/directories/api");

const givenName = "first";
const familyName = "surname";
const email = "email@example.com";
const correlationId = "abc123";
const clientId = "client1";
const redirectUri = "http://client.one";
const overrides = {
  subject: "A subject",
  body: "A body",
};
const permission = "permission";
const orgName = "An org name";
const apiResponse = [
  {
    code: "ABC123",
  },
];

describe("when creating a change email code in the directories api", () => {
  beforeEach(() => {
    fetchApi.mockReset();
    fetchApi.mockImplementation(() => {
      return apiResponse;
    });

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue("token"),
      };
    });
  });

  it("should POST to the invitations endpoint when given valid parameters", async () => {
    await createInvite(
      givenName,
      familyName,
      email,
      clientId,
      redirectUri,
      correlationId,
      overrides,
      permission,
      orgName,
    );

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://directories.test/invitations",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "POST",
    });
  });

  it("then it should use the token from jwt strategy as bearer token", async () => {
    await createInvite(
      givenName,
      familyName,
      email,
      clientId,
      redirectUri,
      correlationId,
      overrides,
      permission,
      orgName,
    );

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("then it should include the correlation id", async () => {
    await createInvite(
      givenName,
      familyName,
      email,
      clientId,
      redirectUri,
      correlationId,
      overrides,
      permission,
      orgName,
    );

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  });

  it("then it will include userid, code type, email address, client id and redirect uri in the body", async () => {
    await createInvite(
      givenName,
      familyName,
      email,
      clientId,
      redirectUri,
      correlationId,
      overrides,
      permission,
      orgName,
    );

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      body: {
        firstName: "first",
        lastName: "surname",
        email: "email@example.com",
        origin: { clientId: "client1", redirectUri: "http://client.one" },
        selfStarted: false,
        overrides: { subject: "A subject", body: "A body" },
        isApprover: false,
        orgName: "An org name",
      },
    });
  });
});
