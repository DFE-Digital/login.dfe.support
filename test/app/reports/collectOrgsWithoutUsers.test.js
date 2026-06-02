jest.mock("login.dfe.api-client/organisations", () => ({
  getCollectOrgsWithoutActiveUsersRaw: jest.fn(),
}));
jest.mock("../../../src/infrastructure/logger");

const {
  getCollectOrgsWithoutActiveUsersRaw,
} = require("login.dfe.api-client/organisations");
const { get } = require("../../../src/app/reports/collectOrgsWithoutUsers");
const { getResponseMock } = require("../../utils");

describe("GET /reports/collect-orgs", () => {
  let req, res;

  beforeEach(() => {
    req = { correlationId: "corr-1" };
    res = getResponseMock();
    getCollectOrgsWithoutActiveUsersRaw.mockClear();
  });

  it("renders the view with the organisation list", async () => {
    const orgs = [{ org_id: "org-1", org_name: "Test School" }];
    getCollectOrgsWithoutActiveUsersRaw.mockResolvedValue(orgs);

    await get(req, res);

    expect(res.render).toHaveBeenCalledWith(
      "reports/views/collectOrgsWithoutUsers",
      expect.objectContaining({ organisations: orgs }),
    );
  });

  it("renders with an empty array when the API returns null", async () => {
    getCollectOrgsWithoutActiveUsersRaw.mockResolvedValue(null);

    await get(req, res);

    expect(res.render).toHaveBeenCalledWith(
      "reports/views/collectOrgsWithoutUsers",
      expect.objectContaining({ organisations: [] }),
    );
  });

  it("renders with an empty array when the API throws", async () => {
    getCollectOrgsWithoutActiveUsersRaw.mockRejectedValue(
      new Error("API error"),
    );

    await get(req, res);

    expect(res.render).toHaveBeenCalledWith(
      "reports/views/collectOrgsWithoutUsers",
      expect.objectContaining({ organisations: [] }),
    );
  });
});
