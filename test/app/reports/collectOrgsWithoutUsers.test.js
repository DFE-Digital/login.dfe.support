const mockGet = jest.fn();
const mockGetApiClient = jest.fn(() => ({ get: mockGet }));

jest.mock("login.dfe.api-client/api", () => ({
  getApiClient: (...args) => mockGetApiClient(...args),
  ApiName: { Organisations: "organisations" },
}));
jest.mock("../../../src/infrastructure/logger");

const { get } = require("../../../src/app/reports/collectOrgsWithoutUsers");
const { getResponseMock } = require("../../utils");

describe("GET /reports/collect-orgs", () => {
  let req, res;

  beforeEach(() => {
    req = { correlationId: "corr-1" };
    res = getResponseMock();
    mockGet.mockClear();
    mockGetApiClient.mockClear();
  });

  it("renders the view with the organisation list", async () => {
    const orgs = [{ org_id: "org-1", org_name: "Test School" }];
    mockGet.mockResolvedValue(orgs);

    await get(req, res);

    expect(mockGetApiClient).toHaveBeenCalledWith("organisations");
    expect(mockGet).toHaveBeenCalledWith(
      "/organisations/collect-without-active-users",
      expect.objectContaining({
        additionalHeaders: { "x-correlation-id": "corr-1" },
      }),
    );
    expect(res.render).toHaveBeenCalledWith(
      "reports/views/collectOrgsWithoutUsers",
      expect.objectContaining({ organisations: orgs }),
    );
  });

  it("renders with an empty array when the API returns null", async () => {
    mockGet.mockResolvedValue(null);
    await get(req, res);
    expect(res.render).toHaveBeenCalledWith(
      "reports/views/collectOrgsWithoutUsers",
      expect.objectContaining({ organisations: [] }),
    );
  });

  it("renders with an empty array when the API throws", async () => {
    mockGet.mockRejectedValue(new Error("API error"));
    await get(req, res);
    expect(res.render).toHaveBeenCalledWith(
      "reports/views/collectOrgsWithoutUsers",
      expect.objectContaining({ organisations: [] }),
    );
  });
});
