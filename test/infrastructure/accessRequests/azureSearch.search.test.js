jest.mock("ioredis", () => jest.fn().mockImplementation(() => {}));
jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory({
    cache: {
      params: {
        indexPointerConnectionString: "redis://localhost",
        serviceName: "test-search",
        apiKey: "some-key",
      },
    },
  }),
);
jest.mock("login.dfe.async-retry");
jest.mock("uuid", () => ({ v4: jest.fn().mockReturnValue("some-uuid") }));

const { fetchApi } = require("login.dfe.async-retry");

describe("when searching for a access request in azure search", () => {
  let search;

  beforeEach(() => {
    fetchApi.mockReset();
    fetchApi.mockImplementation(() => {
      return {
        "@odata.context":
          "https://sbsa-search.search.windows.net/indexes('accessrequests-7170516e-5671-4ea7-8e52-adfc901c73c3')/$metadata#docs",
        "@odata.count": 49,
        value: [
          {
            "@search.score": 0.4066307,
            userId: "34080a9c-fd79-45a6-a092-4756264d5c85",
            orgId: "56080a9c-fd79-45a6-a092-4756264d5c85",
            name: "User One",
            email: "user.one@unit.test",
            organisationName: "Testing school",
            createdDate: "2018-11-01T20:00:00.000Z",
          },
        ],
      };
    });

    jest.doMock("ioredis", () =>
      jest.fn().mockImplementation(() => {
        const RedisMock = require("ioredis-mock").default;
        const redisMock = new RedisMock();
        redisMock.set("CurrentIndex_AccessRequests", "test-index");
        return redisMock;
      }),
    );

    search =
      require("./../../../src/infrastructure/accessRequests/azureSearch").search;
  });

  it("then it should search the current index for the criteria and page, with a page size of 25 and ordered by name if no order specified", async () => {
    await search("test", 1);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "https://test-search.search.windows.net/indexes/test-index/docs?api-version=2016-09-01&search=test&$count=true&$skip=0&$top=25&$orderby=name",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("then it should search the current index for the criteria and page, with a page size of 25 and ordered by specified field if possible", async () => {
    await search("test", 1, "organisation", false);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe(
      "https://test-search.search.windows.net/indexes/test-index/docs?api-version=2016-09-01&search=test&$count=true&$skip=0&$top=25&$orderby=organisationName desc",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("then it should include the api key from config", async () => {
    await search("test", 1);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        "api-key": "some-key",
      },
    });
  });

  it("then it should map results to response", async () => {
    const actual = await search("test", 1);

    expect(actual).not.toBeNull();
    expect(actual.numberOfPages).toBe(2);
    expect(actual.accessRequests).toHaveLength(1);
    expect(actual.accessRequests[0]).toMatchObject({
      userId: "34080a9c-fd79-45a6-a092-4756264d5c85",
      name: "User One",
      email: "user.one@unit.test",
      organisation: {
        id: "56080a9c-fd79-45a6-a092-4756264d5c85",
        name: "Testing school",
      },
      createdDate: new Date("2018-11-01T20:00:00.000Z"),
    });
  });

  it("then the search value is set to lowercase and white space is removed", async () => {
    await search("Test User", 1);

    expect(fetchApi.mock.calls[0][0]).toBe(
      "https://test-search.search.windows.net/indexes/test-index/docs?api-version=2016-09-01&search=testuser&$count=true&$skip=0&$top=25&$orderby=name",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });

  it("then the search value is encoded", async () => {
    await search("Test@User", 1);

    expect(fetchApi.mock.calls[0][0]).toBe(
      "https://test-search.search.windows.net/indexes/test-index/docs?api-version=2016-09-01&search=testuser&$count=true&$skip=0&$top=25&$orderby=name",
    );
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: "GET",
    });
  });
});
