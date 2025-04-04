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
  updateInvitationService,
} = require("../../../src/infrastructure/access/api");

const invitationId = "invitation-1";
const serviceId = "service-1";
const organisationId = "organisation-1";
const roles = [];
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
    await updateInvitationService(
      invitationId,
      serviceId,
      organisationId,
      roles,
      correlationId,
    );

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://access.test/invitations/invitation-1/services/service-1/organisations/organisation-1",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "PATCH",
    });
  });

  it("then it should use the token from jwt strategy as bearer token", async () => {
    await updateInvitationService(
      invitationId,
      serviceId,
      organisationId,
      roles,
      correlationId,
    );

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("then it should include the correlation id", async () => {
    await updateInvitationService(
      invitationId,
      serviceId,
      organisationId,
      roles,
      correlationId,
    );

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  });

  it("should return false on a 403 or 409 response", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("not found");
      error.statusCode = 403;
      throw error;
    });

    let result = await updateInvitationService(
      invitationId,
      serviceId,
      organisationId,
      roles,
      correlationId,
    );
    expect(result).toEqual(false);

    fetchApi.mockImplementation(() => {
      const error = new Error("conflict");
      error.statusCode = 409;
      throw error;
    });

    result = await updateInvitationService(
      invitationId,
      serviceId,
      organisationId,
      roles,
      correlationId,
    );
    expect(result).toEqual(false);
  });

  it("should raise an exception on any failure status code that is not 403 or 409", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Client Error");
      error.statusCode = 400;
      throw error;
    });

    try {
      await updateInvitationService(
        invitationId,
        serviceId,
        organisationId,
        roles,
        correlationId,
      );
    } catch (e) {
      expect(e.statusCode).toEqual(400);
      expect(e.message).toEqual("Client Error");
    }
  });
});
