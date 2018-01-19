jest.mock('./../../../src/infrastructure/users', () => {
  return {
    search: jest.fn().mockReturnValue([]),
  };
});

const {search} = require('./../../../src/app/users/utils');

describe('When processing a user search request', () => {
  let usersSearchResult;
  let users;

  beforeEach(() => {
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
    users.search = jest.fn().mockReturnValue({
      users: usersSearchResult,
      numberOfPages: 3,
    });
  });

  describe('and the request is a POST', () => {
    let req;

    beforeEach(() => {
      req = {
        method: 'POST',
        body: {
          criteria: 'test',
        },
      };
    });

    test('then it should include the users from the adapter if criteria is supplied', async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        users: usersSearchResult
      });
    });

    test('then it should include a blank users array if no criteria provided', async () => {
      req.body.criteria = '';

      const actual = await search(req);

      expect(actual).toMatchObject({
        users: [],
      });
    });

    test('then it should include posted criteria', async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        criteria: req.body.criteria,
      });
    });

    test('then it should default to page 1', async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        page: 1,
      });
      expect(users.search.mock.calls[0][1]).toBe(1);
    });

    test('then it should include number of pages from search result', async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        numberOfPages: 3,
      });
    });
  });

  describe('and the request is a GET', () => {
    let req;

    beforeEach(() => {
      req = {
        method: 'GET',
        query: {
          criteria: 'test',
        },
      };
    });

    test('then it should include the users from the adapter if criteria is supplied', async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        users: usersSearchResult
      });
    });

    test('then it should include a blank users array if no criteria provided', async () => {
      req.query.criteria = '';

      const actual = await search(req);

      expect(actual).toMatchObject({
        users: [],
      });
    });

    test('then it should include posted criteria', async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        criteria: req.query.criteria,
      });
    });

    test('then it should default to page 1 if not specified', async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        page: 1,
      });
      expect(users.search.mock.calls[0][1]).toBe(1);
    });

    test('then it should use page number from query if specified', async () => {
      req.query.page = 2;

      const actual = await search(req);

      expect(actual).toMatchObject({
        page: 2,
      });
      expect(users.search.mock.calls[0][1]).toBe(2);
    });

    test('then it should include number of pages from search result', async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        numberOfPages: 3,
      });
    });
  });
});