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
const { updateInvite } = require("../../../src/infrastructure/directories/api");

const correlationId = "abc123";
const invitationId = "invite1";
const email = "some.user@test.local";
const apiResponse = {
  firstName: "Some",
  lastName: "User",
  email: "some.user@test.local",
  keyToSuccessId: "1234567",
  tokenSerialNumber: "12345678901",
  id: invitationId,
};

describe("when updating an invite", () => {
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

  it("then it should PATCH the invitations resource with invitation id", async () => {
    await updateInvite(invitationId, email, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://directories.test/invitations/invite1",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "PATCH",
    });
  });

  it("then it should use the token from jwt strategy as bearer token", async () => {
    await updateInvite(invitationId, email, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("then it should include the correlation id", async () => {
    await updateInvite(invitationId, email, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  });

  it("should consume the exception and return undefined if a non-success status is returned", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Server Error");
      error.statusCode = 500;
      throw error;
    });

    const result = await updateInvite(invitationId, email, correlationId);
    await expect(result).toBe(undefined);
  });
});
