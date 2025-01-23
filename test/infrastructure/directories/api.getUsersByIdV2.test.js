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
  getUsersByIdV2,
} = require("../../../src/infrastructure/directories/api");

const correlationId = "abc123";
const apiResponse = {
  users: [],
  numberOfPages: 1,
};
const userIds = ["user1", "user2"];

describe("when getting a page of users from directories api", () => {
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

  it("then it sends a POST directories api with ids in the body", async () => {
    await getUsersByIdV2(userIds, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://directories.test/users/by-ids",
    );
    // Why does a get function have a POST in it??
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "POST",
    });
    expect(fetchApi.mock.calls[0][1].body.ids).toBe("user1,user2");
  });

  it("then it should use the token from jwt strategy as bearer token", async () => {
    await getUsersByIdV2(userIds, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("then it should include the correlation id", async () => {
    await getUsersByIdV2(userIds, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  });

  it("should return null on a 404 response", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Not found");
      error.statusCode = 404;
      throw error;
    });

    const result = await getUsersByIdV2(userIds, correlationId);
    expect(result).toEqual(null);
  });

  it("should raise an exception on any failure status code that is not 404", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Server Error");
      error.statusCode = 500;
      throw error;
    });

    const act = () => getUsersByIdV2(userIds, correlationId);

    await expect(act).rejects.toThrow(
      expect.objectContaining({
        message: "Server Error",
        statusCode: 500,
      }),
    );
  });
});
