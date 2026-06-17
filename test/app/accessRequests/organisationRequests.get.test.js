jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger");
jest.mock("./../../../src/app/accessRequests/utils", () => ({
  search: jest.fn(),
  mapStatusForSupport: jest
    .fn()
    .mockReturnValue({ id: 0, name: "Awaiting approver action" }),
  userStatusMap: [],
  requestTypeMap: [],
  unpackMultiSelect: jest.fn().mockReturnValue([]),
}));
jest.mock("login.dfe.api-client/users", () => ({
  getUsersRaw: jest.fn().mockResolvedValue([]),
}));

const utils = require("./../../../src/app/accessRequests/utils");
const { getRequestMock, getResponseMock } = require("./../../utils");
const {
  get,
} = require("./../../../src/app/accessRequests/organisationRequests");

const baseSearchResult = {
  accessRequests: [],
  page: 1,
  numberOfPages: 1,
  totalNumberOfResults: 0,
  searchEmail: "",
};

describe("organisationRequests GET", () => {
  let req;
  let res;

  beforeEach(() => {
    req = getRequestMock({ method: "GET", query: {} });
    res = getResponseMock();
    utils.search.mockReset().mockResolvedValue(baseSearchResult);
  });

  it("renders the organisationRequests view", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][0]).toBe(
      "accessRequests/views/organisationRequests",
    );
  });

  it("includes searchEmail in the model from the request query", async () => {
    req = getRequestMock({
      method: "GET",
      query: { searchEmail: "user@example.com" },
    });
    utils.search.mockResolvedValue({
      ...baseSearchResult,
      searchEmail: "user@example.com",
    });

    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      searchEmail: "user@example.com",
    });
  });

  it("sets noUserFound to false when search does not return noUserFound", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({ noUserFound: false });
  });

  it("sets noUserFound to true when search returns noUserFound", async () => {
    utils.search.mockResolvedValue({
      ...baseSearchResult,
      noUserFound: true,
      searchEmail: "missing@example.com",
    });

    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({ noUserFound: true });
  });

  it("defaults searchEmail to empty string when absent from query", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({ searchEmail: "" });
  });
});
