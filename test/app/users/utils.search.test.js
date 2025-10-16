jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/users", () => ({
  search: jest.fn().mockReturnValue([]),
}));
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("../../../src/app/users/userSearchHelpers/searchAndMapUsers");

const logger = require("../../../src/infrastructure/logger");
const { search } = require("../../../src/app/users/utils");
const {
  searchAndMapUsers,
} = require("../../../src/app/users/userSearchHelpers/searchAndMapUsers");

describe("When processing a user search request", () => {
  let usersSearchResult;
  const lastLogin = new Date(2018, 0, 11, 11, 30, 57).toISOString();

  beforeEach(() => {
    usersSearchResult = {
      users: [
        {
          name: "Timmy Tester",
          email: "timmy@tester.test",
          organisation: {
            name: "Testco",
          },
          lastLogin: lastLogin,
          status: {
            description: "Active",
          },
        },
      ],
      numberOfPages: 3,
    };
    searchAndMapUsers.mockReset().mockReturnValue(usersSearchResult);

    logger.audit.mockReset();
  });

  describe("and the request is a POST", () => {
    let req;

    beforeEach(() => {
      req = {
        method: "POST",
        body: {
          criteria: "test",
        },
        user: {
          sub: "user1",
          email: "user.one@unit.test",
        },
      };

      req.session = jest.fn().mockReturnValue({
        params: { ...req.query, redirectedFromOrganisations: true },
      });
    });

    test("then it should include the users from the adapter if criteria is supplied", async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        users: usersSearchResult.users,
      });
      expect(searchAndMapUsers.mock.calls[0][0]).toMatchObject({
        criteria: "test*",
      });
    });

    test("then it should search if criteria includes + character", async () => {
      req.body.criteria = "user.one+1@unit.test";

      const result = await search(req);

      expect(searchAndMapUsers).toHaveBeenCalled();
      expect(result.criteria).toEqual("user.one+1@unit.test");
    });

    it("should put the criteria in double quotes if there is a dash character in it", async () => {
      req.body.criteria = "user.one-1@unit.test";

      const result = await search(req);

      expect(searchAndMapUsers).toHaveBeenCalled();
      // Note the double quotes (with one set of quotes escaped)
      expect(searchAndMapUsers).toHaveBeenCalledWith({
        criteria: '"user.one-1@unit.test"*',
        filterBy: { organisationCategories: [], serviceIds: [], statusId: [] },
        pageNumber: 1,
        sortAsc: true,
        sortBy: "name",
      });
      expect(result.criteria).toEqual("user.one-1@unit.test");
    });

    test("then it should not search if criteria includes any other special characters", async () => {
      req.body.criteria = "user.one£@unit.test";

      const result = await search(req);

      expect(searchAndMapUsers).not.toHaveBeenCalled();
      expect(result).toEqual({
        validationMessages: {
          criteria: "Special characters cannot be used",
        },
      });
    });

    it("should not search if criteria includes any other special characters and filtering is off", async () => {
      req.body.isFilterToggle = "true";
      req.body.showFilters = "true";
      req.body.criteria = "user.one£@unit.test";

      const result = await search(req);

      expect(searchAndMapUsers).toHaveBeenCalled();
      expect(result).toEqual({
        criteria: "",
        page: 1,
        sortBy: "name",
        sortOrder: "asc",
        numberOfPages: 3,
        totalNumberOfResults: undefined,
        users: [
          {
            name: "Timmy Tester",
            email: "timmy@tester.test",
            organisation: {
              name: "Testco",
            },
            lastLogin: lastLogin,
            status: {
              description: "Active",
            },
          },
        ],
        validationMessages: {
          criteria: "Special characters cannot be used",
        },
        sort: {
          name: {
            nextDirection: "desc",
            applied: true,
          },
          email: {
            nextDirection: "asc",
            applied: false,
          },
          organisation: {
            nextDirection: "asc",
            applied: false,
          },
          lastLogin: {
            nextDirection: "asc",
            applied: false,
          },
          status: {
            nextDirection: "asc",
            applied: false,
          },
        },
      });
    });

    test("then it should not search and return validation error if criteria does not meet minimum length", async () => {
      req.body.criteria = "";

      const result = await search(req);

      expect(searchAndMapUsers).not.toHaveBeenCalled();
      expect(result).toEqual({
        validationMessages: {
          criteria: "Please enter at least 4 characters",
        },
      });
    });

    test("then it should include posted criteria", async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        criteria: req.body.criteria,
      });
    });

    test("then it should default to page 1", async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        page: 1,
      });
      expect(searchAndMapUsers.mock.calls[0][0]).toMatchObject({
        pageNumber: 1,
      });
    });

    it("should default to page 1 if the supplied page is not a number", async () => {
      req.body.page = "not-a-number";
      const actual = await search(req);

      expect(actual).toMatchObject({
        page: 1,
      });
      expect(searchAndMapUsers.mock.calls[0][0]).toMatchObject({
        pageNumber: 1,
      });
    });

    test("then it should include number of pages from search result", async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        numberOfPages: 3,
      });
    });

    test("then it should audit that a search has occured", async () => {
      await search(req);

      expect(logger.audit.mock.calls).toHaveLength(1);
      expect(logger.audit.mock.calls[0][0]).toBe(
        'user.one@unit.test (id: user1) searched for users in support using criteria "test"',
      );
      expect(logger.audit.mock.calls[0][1]).toMatchObject({
        type: "support",
        subType: "user-search",
        userId: "user1",
        userEmail: "user.one@unit.test",
        criteria: "test",
        pageNumber: 1,
        numberOfPages: 3,
      });
    });

    test("then it should default to sort by name if not specified", async () => {
      const actual = await search(req);

      expect(actual.sort.name.nextDirection).toBe("desc");
      expect(actual.sort.name.applied).toBe(true);
      expect(searchAndMapUsers.mock.calls[0][0]).toMatchObject({
        sortBy: "name",
      });
    });

    test("then it should filter by organisation categories if specified", async () => {
      req.body.organisationType = ["org1", "org2"];

      await search(req);

      expect(searchAndMapUsers.mock.calls).toHaveLength(1);
      expect(searchAndMapUsers.mock.calls[0][0]).toMatchObject({
        filterBy: { organisationCategories: ["org1", "org2"] },
      });
    });

    test("then it should filter by account status if specified", async () => {
      req.body.accountStatus = ["-1", "1"];

      await search(req);

      expect(searchAndMapUsers.mock.calls).toHaveLength(1);
      expect(searchAndMapUsers.mock.calls[0][0]).toMatchObject({
        filterBy: { statusId: ["-1", "1"] },
      });
    });

    test("then it should filter by service id if specified", async () => {
      req.body.service = ["svc1", "svc2"];

      await search(req);

      expect(searchAndMapUsers.mock.calls).toHaveLength(1);
      expect(searchAndMapUsers.mock.calls[0][0]).toMatchObject({
        filterBy: {
          serviceIds: ["svc1", "svc2"],
          statusId: [],
          organisationCategories: [],
        },
      });
    });
  });

  describe("and the request is a GET", () => {
    let req;

    beforeEach(() => {
      req = {
        method: "GET",
        query: {
          criteria: "test",
        },
        user: {
          sub: "user1",
          email: "user.one@unit.test",
        },
      };
      req.session = jest.fn().mockReturnValue({
        params: { ...req.query, redirectedFromOrganisations: true },
      });
    });

    test("then it should include the users from the adapter using supplier criteria", async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        users: usersSearchResult.users,
      });
      expect(searchAndMapUsers.mock.calls[0][0]).toMatchObject({
        criteria: "test*",
      });
    });

    test("then it should not search and return validation error if criteria does not meet minimum length", async () => {
      req.query.criteria = "";

      const result = await search(req);

      expect(searchAndMapUsers).not.toHaveBeenCalled();
      expect(result).toEqual({
        validationMessages: {
          criteria: "Please enter at least 4 characters",
        },
      });
    });

    test("then it should not search and return validation error if criteria has special characters in it", async () => {
      req.query.criteria = 'test!"£$%^&*@test.com';

      const result = await search(req);

      expect(searchAndMapUsers).not.toHaveBeenCalled();
      expect(result).toEqual({
        validationMessages: {
          criteria: "Special characters cannot be used",
        },
      });
    });

    test("then it should include posted criteria", async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        criteria: req.query.criteria,
      });
    });

    test("then it should default to page 1 if not specified", async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        page: 1,
      });
      expect(searchAndMapUsers.mock.calls[0][0]).toMatchObject({
        pageNumber: 1,
      });
    });

    test("then it should use page number from query if specified", async () => {
      req.query.page = 2;

      const actual = await search(req);

      expect(actual).toMatchObject({
        page: 2,
      });
      expect(searchAndMapUsers.mock.calls[0][0]).toEqual(
        expect.objectContaining({ pageNumber: 2 }),
      );
    });

    test("then it should include number of pages from search result", async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        numberOfPages: 3,
      });
    });

    test("then it should audit that a search has occured", async () => {
      await search(req);

      expect(logger.audit.mock.calls).toHaveLength(1);
      expect(logger.audit.mock.calls[0][0]).toBe(
        'user.one@unit.test (id: user1) searched for users in support using criteria "test"',
      );
      expect(logger.audit.mock.calls[0][1]).toMatchObject({
        type: "support",
        subType: "user-search",
        userId: "user1",
        userEmail: "user.one@unit.test",
        criteria: "test",
        pageNumber: 1,
        numberOfPages: 3,
      });
    });

    test("then it should default to sort by name if not specified", async () => {
      const actual = await search(req);

      expect(actual.sort.name.nextDirection).toBe("desc");
      expect(actual.sort.name.applied).toBe(true);
      expect(searchAndMapUsers).toHaveBeenCalledWith({
        criteria: "test*",
        filterBy: { organisationCategories: [], serviceIds: [], statusId: [] },
        pageNumber: 1,
        sortAsc: true,
        sortBy: "name",
      });
    });

    test("then it should use sort order specified", async () => {
      req.query.sort = "email";
      req.query.sortDir = "desc";

      const actual = await search(req);

      expect(actual.sort.email.nextDirection).toBe("asc");
      expect(actual.sort.email.applied).toBe(true);
      expect(searchAndMapUsers).toHaveBeenCalledWith({
        criteria: "test*",
        filterBy: { organisationCategories: [], serviceIds: [], statusId: [] },
        pageNumber: 1,
        sortAsc: false,
        sortBy: "email",
      });
    });
  });
});
