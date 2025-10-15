jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/app/accessRequests/utils", () => {
  return {
    search: jest.fn().mockReturnValue({
      criteria: "test",
      page: 1,
      numberOfPages: 3,
      usersForApproval: [],
    }),
  };
});

const utils = require("./../../../src/app/accessRequests/utils");
const { post } = require("./../../../src/app/accessRequests/search");

describe("When processing a post to search for access requests", () => {
  let req;
  let res;
  let usersSearchResult;
  let usersForApproval;
  beforeEach(() => {
    req = {
      method: "POST",
      body: {
        criteria: "test",
      },
      csrfToken: () => {
        return "token";
      },
      accepts: () => {
        return ["text/html"];
      },
    };

    res = {
      render: jest.fn(),
    };

    usersForApproval = [
      {
        name: "Timmy Tester",
        email: "timmy@tester.test",
        organisation: {
          id: "org1",
          name: "Testco",
        },
        createdDate: new Date(2018, 0, 11, 11, 30, 57),
      },
    ];

    utils.search.mockReset();
    utils.search.mockReturnValue({
      criteria: "test",
      page: 1,
      numberOfPages: 3,
      sortBy: "test",
      sortOrder: "desc",
      usersForApproval,
    });
  });

  test("then it should render the access requests view", async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][0]).toBe("accessRequests/views/search");
  });

  test("then it should include csrf token", async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  test("then it should include criteria", async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      criteria: "test",
    });
  });

  test("then it should include page details", async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      page: 1,
      numberOfPages: 3,
    });
  });

  test("then it includes the sort order and sort value", async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      sortBy: "test",
      sortOrder: "desc",
    });
  });

  test("then it should include users", async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      usersForApproval: usersSearchResult,
    });
  });
});
