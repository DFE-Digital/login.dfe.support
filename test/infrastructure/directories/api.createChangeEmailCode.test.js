jest.mock("login.dfe.async-retry");
jest.mock("login.dfe.jwt-strategies");
jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory({
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
const {
  createChangeEmailCode,
} = require("./../../../src/infrastructure/directories/api");

const correlationId = "abc123";
const userId = "user1";
const newEmailAddress = "user.one@unit.tests";
const clientId = "client1";
const redirectUri = "http://client.one";
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

  it("then it should call user codes resource with uid", async () => {
    await createChangeEmailCode(
      userId,
      newEmailAddress,
      clientId,
      redirectUri,
      correlationId,
    );

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://directories.test/usercodes/upsert",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "PUT",
    });
  });

  it("then it should use the token from jwt strategy as bearer token", async () => {
    await createChangeEmailCode(
      userId,
      newEmailAddress,
      clientId,
      redirectUri,
      correlationId,
    );

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("then it should include the correlation id", async () => {
    await createChangeEmailCode(
      userId,
      newEmailAddress,
      clientId,
      redirectUri,
      correlationId,
    );

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  });

  it("then it will include userid, code type, email address, client id and redirect uri in the body", async () => {
    await createChangeEmailCode(
      userId,
      newEmailAddress,
      clientId,
      redirectUri,
      correlationId,
    );

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      body: {
        uid: userId,
        clientId,
        redirectUri,
        codeType: "changeemail",
        email: newEmailAddress,
        selfInvoked: false,
      },
    });
  });
});
