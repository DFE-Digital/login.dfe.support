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
  deactivateInvite,
} = require("./../../../src/infrastructure/directories/api");

const correlationId = "abc123";
const invitationId = "invite1";
const reason = "invite not needed";

describe("when deactivating an invite from the directories api", () => {
  beforeEach(() => {
    fetchApi.mockReset();
    fetchApi.mockImplementation(() => {});

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue("token"),
      };
    });
  });

  it("then it should call invitations resource with invitation id", async () => {
    await deactivateInvite(invitationId, reason, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://directories.test/invitations/invite1",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "PATCH",
    });
  });

  it("then the reason for deactivate is in the body", async () => {
    await deactivateInvite(invitationId, reason, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      body: {
        reason: "invite not needed",
        deactivated: true,
      },
    });
  });

  it("then it should use the token from jwt strategy as bearer token", async () => {
    await deactivateInvite(invitationId, reason, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("then it should include the correlation id", async () => {
    await deactivateInvite(invitationId, reason, correlationId);

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

    const result = await deactivateInvite(invitationId, reason, correlationId);
    await expect(result).toBe(undefined);
  });
});
