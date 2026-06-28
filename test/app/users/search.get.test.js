jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/app/users/utils", () => {
  return {
    search: jest.fn().mockReturnValue({
      criteria: "test",
      page: 1,
      numberOfPages: 3,
      users: [],
    }),
  };
});
jest.mock("../../../src/app/services/utils", () => ({
  getAllServices: jest.fn(),
}));
jest.mock("login.dfe.api-client/organisations", () => ({
  getOrganisationCategories: jest.fn(),
}));

const utils = require("./../../../src/app/users/utils");
const { getRequestMock, getResponseMock } = require("./../../utils");
const { get } = require("./../../../src/app/users/search");
const { getAllServices } = require("../../../src/app/services/utils");
const {
  getOrganisationCategories,
} = require("login.dfe.api-client/organisations");

describe("When processing a get to search for users", () => {
  let req;
  let res;
  let usersSearchResult;

  beforeEach(() => {
    req = getRequestMock({
      method: "GET",
    });

    res = getResponseMock();

    usersSearchResult = [
      {
        name: "Timmy Tester",
        email: "timmy@tester.test",
        organisation: {
          name: "Testco",
        },
        lastLogin: new Date(2018, 0, 11, 11, 30, 57),
        status: {
          description: "Active",
        },
      },
    ];

    utils.search.mockReset();
    utils.search.mockReturnValue({
      criteria: "test",
      page: 1,
      numberOfPages: 3,
      sortBy: "test",
      sortOrder: "desc",
      users: usersSearchResult,
    });
  });

  test("then it should render the search view", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][0]).toBe("users/views/search");
  });

  test("then it should include csrf token", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
    expect(utils.search).not.toHaveBeenCalled();
  });

  it("should clear existing session data", async () => {
    req.session = {
      user: {
        id: "user-id",
      },
      createServiceData: {
        serviceType: "idOnly",
        hideFromUserServices: undefined,
        hideFromContactUs: undefined,
        name: "newServiceName",
        description: "newServiceDescription blah",
      },
    };
    await get(req, res);

    expect(req.session.user).toBe(undefined);
    expect(req.session.createServiceData).toBe(undefined);
  });

  test("then it should include undefined values for search result properties as GET does not do a search anymore", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      criteria: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      page: undefined,
      numberOfPages: undefined,
      users: undefined,
    });
  });
});

describe("When showFilters is true", () => {
  let filterReq;
  let filterRes;

  beforeEach(() => {
    getOrganisationCategories.mockReturnValue([]);
    getAllServices.mockReset();
    getAllServices.mockReturnValue({
      services: [
        {
          id: "visible-service",
          name: "Visible Service",
          isIdOnlyService: false,
          relyingParty: { params: {} },
        },
        {
          id: "hidden-service",
          name: "Hidden Service",
          isIdOnlyService: false,
          relyingParty: { params: { hideSupport: "true" } },
        },
      ],
    });

    filterReq = getRequestMock({
      method: "GET",
      query: { showFilters: "true" },
    });
    filterRes = getResponseMock();
  });

  it("should exclude hidden services from the service filter checkboxes", async () => {
    await get(filterReq, filterRes);

    const model = filterRes.render.mock.calls[0][1];
    const serviceIds = model.services.map((s) => s.id);
    expect(serviceIds).toContain("visible-service");
    expect(serviceIds).not.toContain("hidden-service");
  });
});
