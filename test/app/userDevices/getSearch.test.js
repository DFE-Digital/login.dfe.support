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
const get = require('./../../../src/app/userDevices/getSearch');

describe('When processing a get to search for user devices', () => {
  let req;
  let res;
  let usersSearchResult;

  beforeEach(() => {
    req = {
      method: 'GET',
      query: {
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

    usersSearchResult = [
      {
        name: 'Timmy Tester',
        email: 'timmy@tester.test',
        organisation: {
          name: 'Testco'
        },
        lastLogin: new Date(2018, 0, 11, 11, 30, 57),
        devices: {
          id: '123456',
          serialNumber: '444-333-222',
          status: 'Active'
        }
      },
    ];

    utils.search.mockReset();
    utils.search.mockReturnValue({
      criteria: 'test',
      page: 1,
      numberOfPages: 3,
      userDevices: usersSearchResult
    });
  });

  test('then it should render the search view', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][0]).toBe('userDevices/views/search');
  });

  test('then it should include csrf token', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });


  test('then it should include page details', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      page: 1,
      numberOfPages: 3,
    });
  });

  test('then it should include users', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      userDevices: usersSearchResult,
    });
  });
});