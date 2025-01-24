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
  getPageOfInvitations,
} = require("./../../../src/infrastructure/directories/api");

const pageNumber = 1;
const pageSize = 123;
const correlationId = "abc123";
const apiResponse = {
  invitations: [
    {
      firstName: "User",
      lastName: "One",
      email: "user.one@unit.test",
      keyToSuccessId: "1234567",
      tokenSerialNumber: "1234567890",
      id: "c5e57976-0bef-4f55-b16f-f63a241c9bfa",
    },
  ],
  numberOfPages: 1,
  page: 1,
};

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

  it("then it should call users resource with page & pagesize", async () => {
    await getPageOfInvitations(pageNumber, pageSize, undefined, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://directories.test/invitations?page=1&pageSize=123",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("then it should call users resource with page & pagesize and changedAfter", async () => {
    const changedAfter = new Date("2024-03-20");
    await getPageOfInvitations(
      pageNumber,
      pageSize,
      changedAfter,
      correlationId,
    );

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "http://directories.test/invitations?page=1&pageSize=123&changedAfter=2024-03-20T00:00:00.000Z",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("then it should use the token from jwt strategy as bearer token", async () => {
    await getPageOfInvitations(pageNumber, pageSize, undefined, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer token",
      },
    });
  });

  it("then it should include the correlation id", async () => {
    await getPageOfInvitations(pageNumber, pageSize, undefined, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "x-correlation-id": correlationId,
      },
    });
  });

  it("then it should return api result", async () => {
    const actual = await getPageOfInvitations(
      pageNumber,
      pageSize,
      undefined,
      correlationId,
    );

    expect(actual).toMatchObject(apiResponse);
  });

  it("should return null on a 404 response", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Not found");
      error.statusCode = 404;
      throw error;
    });

    const result = await getPageOfInvitations(
      pageNumber,
      pageSize,
      undefined,
      correlationId,
    );
    expect(result).toEqual(null);
  });

  it("should raise an exception on any failure status code that is not 404", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Server Error");
      error.statusCode = 500;
      throw error;
    });

    const act = () =>
      getPageOfInvitations(pageNumber, pageSize, undefined, correlationId);

    await expect(act).rejects.toThrow(
      expect.objectContaining({
        message: "Server Error",
        statusCode: 500,
      }),
    );
  });
});
