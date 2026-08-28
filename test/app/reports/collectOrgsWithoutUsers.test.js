const mockGet = jest.fn();
const mockGetApiClient = jest.fn(() => ({ get: mockGet }));

jest.mock("login.dfe.api-client/api", () => ({
  getApiClient: (...args) => mockGetApiClient(...args),
  ApiName: { Organisations: "organisations" },
}));
jest.mock("../../../src/infrastructure/logger");

const { get } = require("../../../src/app/reports/collectOrgsWithoutUsers");
const { getResponseMock } = require("../../utils");
const logger = require("../../../src/infrastructure/logger");

const pageOf = (organisations, totalNumberOfRecords, totalNumberOfPages) => ({
  organisations,
  totalNumberOfRecords,
  totalNumberOfPages,
});

describe("GET /reports/collect-orgs", () => {
  let req, res;

  beforeEach(() => {
    req = { id: "corr-1", query: {} };
    res = getResponseMock();
    mockGet.mockClear();
    mockGetApiClient.mockClear();
    logger.error.mockClear();
  });

  it("renders the view with the organisation list and paging details", async () => {
    const orgs = [{ org_id: "org-1", org_name: "Test School" }];
    mockGet.mockResolvedValue(pageOf(orgs, 6083, 244));

    await get(req, res);

    expect(mockGetApiClient).toHaveBeenCalledWith("organisations");
    expect(res.render).toHaveBeenCalledWith(
      "reports/views/collectOrgsWithoutUsers",
      expect.objectContaining({
        organisations: orgs,
        page: 1,
        numberOfPages: 244,
        totalNumberOfResults: 6083,
        loadFailed: false,
      }),
    );
  });

  it("requests the first page by default", async () => {
    mockGet.mockResolvedValue(pageOf([], 0, 0));

    await get(req, res);

    expect(mockGet).toHaveBeenCalledWith(
      "/organisations/collect-without-active-users?page=1&pageSize=25",
      expect.objectContaining({
        additionalHeaders: { "x-correlation-id": "corr-1" },
      }),
    );
  });

  it("requests the page given in the query string", async () => {
    req.query = { page: "7" };
    mockGet.mockResolvedValue(pageOf([], 0, 0));

    await get(req, res);

    expect(mockGet).toHaveBeenCalledWith(
      "/organisations/collect-without-active-users?page=7&pageSize=25",
      expect.anything(),
    );
    expect(res.render).toHaveBeenCalledWith(
      "reports/views/collectOrgsWithoutUsers",
      expect.objectContaining({ page: 7 }),
    );
  });

  it("falls back to page 1 when the query string page is not usable", async () => {
    req.query = { page: "not-a-number" };
    mockGet.mockResolvedValue(pageOf([], 0, 0));

    await get(req, res);

    expect(mockGet).toHaveBeenCalledWith(
      "/organisations/collect-without-active-users?page=1&pageSize=25",
      expect.anything(),
    );
  });

  it("renders an empty result without flagging a failure when the API returns null", async () => {
    mockGet.mockResolvedValue(null);

    await get(req, res);

    expect(res.render).toHaveBeenCalledWith(
      "reports/views/collectOrgsWithoutUsers",
      expect.objectContaining({
        organisations: [],
        totalNumberOfResults: 0,
        loadFailed: false,
      }),
    );
  });

  it("flags a load failure when the API throws, rather than showing an empty report", async () => {
    mockGet.mockRejectedValue(new Error("API error"));

    await get(req, res);

    expect(res.render).toHaveBeenCalledWith(
      "reports/views/collectOrgsWithoutUsers",
      expect.objectContaining({ organisations: [], loadFailed: true }),
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
