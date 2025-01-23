jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/app/accessRequests/utils", () => {
  return {
    getById: jest.fn().mockReturnValue({}),
  };
});

const utils = require("./../../../src/app/accessRequests/utils");
const { getRequestMock, getResponseMock } = require("./../../utils");
const { get } = require("./../../../src/app/accessRequests/accessRequest");

describe("When processing a get for access requests", () => {
  let req;
  let res;
  let accessRequest;

  beforeEach(() => {
    req = getRequestMock({
      method: "GET",
      query: {
        criteria: "test",
      },
    });

    res = getResponseMock();

    accessRequest = {
      name: "Timmy Tester",
      email: "timmy@tester.test",
      organisation: {
        id: "org1",
        name: "Testco",
        address: "test address",
        identifier: "URN: 123123",
      },
      createdDate: new Date(2018, 0, 11, 11, 30, 57),
    };

    utils.getById.mockReset();
    utils.getById.mockReturnValue(accessRequest);
  });

  test("then it should render the request view", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][0]).toBe("accessRequests/views/request");
  });

  test("then it should include csrf token", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: "token",
    });
  });

  test("then it should include the access request", async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      accessRequest: accessRequest,
    });
  });

  test("then it gets the access request by id", async () => {
    await get(req, res);

    expect(utils.getById.mock.calls).toHaveLength(1);
    expect(utils.getById.mock.calls[0][0]).toBe(req);
  });
});
