jest.mock('./../../../src/app/userDevices/utils', () => {
  return {
    search: jest.fn().mockReturnValue({
      criteria: 'test',
      page: 1,
      numberOfPages: 3,
      users: []
    }),
  };
});

const utils = require('./../../../src/app/userDevices/utils');
const post = require('./../../../src/app/userDevices/postSearch');

describe('When processing a post to search for user devices', () => {
  let req;
  let res;
  let userDevicesSearchResult;

  beforeEach(() => {
    req = {
      method: 'POST',
      body: {
        criteria: 'test',
      },
      csrfToken: () => {
        return 'token';
      },
      accepts: () => {
        return ['text/html'];
      },
    };

    res = {
      render: jest.fn(),
    };

    userDevicesSearchResult = [
      {
        name: 'Timmy Tester',
        email: 'timmy@tester.test',
        organisation: {
          name: 'Testco'
        },
        lastLogin: new Date(2018, 0, 11, 11, 30, 57),
        device: {
          id: '123-456',
          serialNumber: '123456',
          status: 'Active'
        }
      },
    ];

    utils.search.mockReset();
    utils.search.mockReturnValue({
      criteria: 'test',
      page: 1,
      numberOfPages: 3,
      sortBy: 'test',
      sortOrder: 'desc',
      userDevices: userDevicesSearchResult
    });
  });

  test('then it should render the search view', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][0]).toBe('userDevices/views/search');
  });

  test('then it should include csrf token', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  test('then it should include criteria', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      criteria: 'test',
    });
  });


  test('then it includes the sort order and sort value', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      sortBy: 'test',
      sortOrder: 'desc'
    });
  });

  test('then it should include page details', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      page: 1,
      numberOfPages: 3,
    });
  });

  test('then it should include user devices', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      userDevices: userDevicesSearchResult,
    });
  });
});