jest.mock("login.dfe.async-retry");
jest.mock("login.dfe.jwt-strategies");
jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory({
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
  removeServiceFromUser,
} = require("../../../src/infrastructure/access/api");

const userId = "user-1";
const serviceId = "service-1";
const organisationId = "organisation-1";
const correlationId = "abc123";
const apiResponse = jest.fn();

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
    await removeServiceFromUser(
      userId,
      serviceId,
      organisationId,
      correlationId,
    );

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://access.test/users/user-1/services/service-1/organisations/organisation-1",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "DELETE",
    });
  });

  it("then it should use the token from jwt strategy as bearer token", async () => {
    await removeServiceFromUser(
      userId,
      serviceId,
      organisationId,
      correlationId,
    );

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("then it should include the correlation id", async () => {
    await removeServiceFromUser(
      userId,
      serviceId,
      organisationId,
      correlationId,
    );

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  });
});
