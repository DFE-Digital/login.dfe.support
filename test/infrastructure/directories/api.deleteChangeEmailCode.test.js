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
const {
  deleteChangeEmailCode,
} = require("../../../src/infrastructure/directories/api");

const correlationId = "abc123";
const userId = "user1";
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
    await deleteChangeEmailCode(userId, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://directories.test/usercodes/user1/changeemail",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "DELETE",
    });
  });

  it("then it should use the token from jwt strategy as bearer token", async () => {
    await deleteChangeEmailCode(userId, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("then it should include the correlation id", async () => {
    await deleteChangeEmailCode(userId, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  });
});
