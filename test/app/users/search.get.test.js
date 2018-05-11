jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/app/users/utils', () => {
  return {
    search: jest.fn().mockReturnValue({
      criteria: 'test',
      page: 1,
      numberOfPages: 3,
      users: []
    }),
  };
});

const utils = require('./../../../src/app/users/utils');
const { getRequestMock, getResponseMock } = require('./../../utils');
const { get } = require('./../../../src/app/users/search');

describe('When processing a get to search for users', () => {
  let req;
  let res;
  let usersSearchResult;

  beforeEach(() => {
    req = getRequestMock({
      method: 'GET',
      query: {
        criteria: 'test',
      },
    });

    res = getResponseMock();

    usersSearchResult = [
      {
        name: 'Timmy Tester',
        email: 'timmy@tester.test',
        organisation: {
          name: 'Testco'
        },
        lastLogin: new Date(2018, 0, 11, 11, 30, 57),
        status: {
          description: 'Active'
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
      users: usersSearchResult
    });
  });

  test('then it should render the search view', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][0]).toBe('users/views/search');
  });

  test('then it should include csrf token', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  test('then it should include criteria', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      criteria: 'test',
    });
  });

  test('then it includes the sort order and sort value', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      sortBy: 'test',
      sortOrder: 'desc'
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
      users: usersSearchResult,
    });
  });
});