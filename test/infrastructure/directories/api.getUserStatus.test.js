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
  getUserStatus,
} = require("../../../src/infrastructure/directories/api");

const correlationId = "abc123";
const userId = "user1";

const apiResponse = {
  id: "78071717-4247-480d-90a3-3d531379ebf8",
  status: 0,
  statusChangeReasons: [
    {
      id: 1,
      user_id: "78071717-4247-480d-90a3-3d531379ebf8",
      old_status: 1,
      new_status: 0,
      reason: "Deactivation reason",
    },
  ],
};

describe("when getting the status of a user from the directories api", () => {
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

  it("then it sends a GET to the directories api with id in the body", async () => {
    await getUserStatus(userId, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://directories.test/users/user1/status",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("then it should use the token from jwt strategy as bearer token", async () => {
    await getUserStatus(userId, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("then it should include the correlation id", async () => {
    await getUserStatus(userId, correlationId);

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

    const result = await getUserStatus(userId, correlationId);
    expect(result).toEqual(null);
  });

  it("should raise an exception on any failure status code that is not 404", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Server Error");
      error.statusCode = 500;
      throw error;
    });

    const act = () => getUserStatus(userId, correlationId);

    await expect(act).rejects.toThrow(
      expect.objectContaining({
        message: "Server Error",
        statusCode: 500,
      }),
    );
  });
});
