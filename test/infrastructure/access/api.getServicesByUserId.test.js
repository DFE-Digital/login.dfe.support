jest.mock("login.dfe.async-retry");
jest.mock("login.dfe.jwt-strategies");
jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory({
    access: {
      type: "api",
      service: {
        url: "http://access.test",
        retryFactor: 0,
        numberOfRetries: 2,
      },
    },
  }),
);

const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");
const {
  getServicesByUserId,
} = require("../../../src/infrastructure/access/api");

const userId = "user-1";
const correlationId = "abc123";
const apiResponse = [
  {
    userId: "user-1",
    serviceId: "service1Id",
    organisationId: "organisation-1",
    roles: [],
  },
  {
    userId: "user-1",
    serviceId: "service2Id",
    organisationId: "organisation-1",
    roles: [],
  },
];

describe("when getting a users services mapping from api", () => {
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

  it("then it should call users resource with user id", async () => {
    await getServicesByUserId(userId, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://access.test/users/user-1/services",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("then it should use the token from jwt strategy as bearer token", async () => {
    await getServicesByUserId(userId, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("then it should include the correlation id", async () => {
    await getServicesByUserId(userId, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  });

  it("should return false on a 404 response", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("not found");
      error.statusCode = 404;
      throw error;
    });

    const result = await getServicesByUserId(userId, correlationId);
    expect(result).toEqual(undefined);
  });

  it("should raise an exception on any failure status code that is not 404", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Client Error");
      error.statusCode = 400;
      throw error;
    });

    try {
      await getServicesByUserId(userId, correlationId);
    } catch (e) {
      expect(e.statusCode).toEqual(400);
      expect(e.message).toEqual("Client Error");
    }
  });
});
