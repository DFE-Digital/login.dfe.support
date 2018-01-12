jest.mock('./../../../src/infrastructure/users', () => {
  return {
    search: jest.fn().mockReturnValue([]),
  };
});

const post = require('./../../../src/app/users/postSearch');

describe('When processing a post to search for users', () => {
  let req;
  let res;
  let usersSearchResult;
  let users;

  beforeEach(() => {
    req = {
      body: {
        criteria: 'test',
      },
      csrfToken: () => {
        return 'token';
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
        status: {
          description: 'Active'
        }
      },
    ];
    users = require('./../../../src/infrastructure/users');
    users.search = jest.fn().mockReturnValue(usersSearchResult);
  });

  test('then it should render the search view', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][0]).toBe('users/views/search');
  });

  test('then it should include the users from the adapter if criteria is supplied', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      users: usersSearchResult
    });
  });

  test('then it should include a blank users array if no criteria provided', async () => {
    req.body.criteria = '';

    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      users: [],
    });
  });

  test('then it should include posted criteria', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      criteria: req.body.criteria,
    });
  });

  test('then it should include csrf token', async () => {
    await post(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });
});