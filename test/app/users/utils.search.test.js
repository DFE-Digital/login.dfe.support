jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/users', () => ({
  search: jest.fn().mockReturnValue([]),
}));
jest.mock('./../../../src/infrastructure/search', () => ({
  searchForUsers: jest.fn(),
}));
jest.mock('./../../../src/infrastructure/logger', () => require('../../utils').loggerMockFactory());

const logger = require('../../../src/infrastructure/logger');
const { searchForUsers } = require('../../../src/infrastructure/search');
const { search } = require('../../../src/app/users/utils');

describe('When processing a user search request', () => {
  let usersSearchResult;

  beforeEach(() => {
    usersSearchResult = {
      users: [
        {
          name: 'Timmy Tester',
          email: 'timmy@tester.test',
          organisation: {
            name: 'Testco',
          },
          lastLogin: new Date(2018, 0, 11, 11, 30, 57),
          status: {
            description: 'Active',
          },
        },
      ],
      numberOfPages: 3,
    };
    searchForUsers.mockReset().mockReturnValue(usersSearchResult);

    logger.audit.mockReset();
  });

  describe('and the request is a POST', () => {
    let req;

    beforeEach(() => {
      req = {
        method: 'POST',
        body: {
          criteria: 'test',
        },
        user: {
          sub: 'user1',
          email: 'user.one@unit.test',
        },
      };

      req.session = jest.fn().mockReturnValue({ params: { ...req.query, redirectedFromOrganisations: true } });
    });

    test('then it should include the users from the adapter if criteria is supplied', async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        users: usersSearchResult.users,
      });
      expect(searchForUsers.mock.calls[0][0]).toBe('test*');
    });

    test('then it should not search and return validation error if criteria does not meet minimum length', async () => {
      req.body.criteria = '';

      const result = await search(req);

      expect(searchForUsers).not.toHaveBeenCalled();
      expect(result).toEqual({
        validationMessages: {
          criteria: 'Please enter at least 4 characters',
        },
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
      expect(searchForUsers.mock.calls[0][1]).toBe(1);
    });

    test('then it should include number of pages from search result', async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        numberOfPages: 3,
      });
    });

    test('then it should audit that a search has occured', async () => {
      await search(req);

      expect(logger.audit.mock.calls).toHaveLength(1);
      expect(logger.audit.mock.calls[0][0]).toBe('user.one@unit.test (id: user1) searched for users in support using criteria "test"');
      expect(logger.audit.mock.calls[0][1]).toMatchObject({
        type: 'support',
        subType: 'user-search',
        userId: 'user1',
        userEmail: 'user.one@unit.test',
        criteria: 'test',
        pageNumber: 1,
        numberOfPages: 3,
      });
    });

    test('then it should default to sort by name if not specified', async () => {
      const actual = await search(req);

      expect(actual.sort.name.nextDirection).toBe('desc');
      expect(actual.sort.name.applied).toBe(true);
      expect(searchForUsers.mock.calls[0][2]).toBe('name');
      expect(searchForUsers.mock.calls[0][3]).toBe('asc');
    });

    test('then it should filter by organisation types if specified', async () => {
      req.body.organisationType = ['org1', 'org2'];

      await search(req);

      expect(searchForUsers.mock.calls).toHaveLength(1);
      expect(searchForUsers.mock.calls[0][4]).toMatchObject({
        organisationCategories: ['org1', 'org2'],
        services: [],
        statusId: [],
      });
    });

    test('then it should filter by account status if specified', async () => {
      req.body.accountStatus = ['-1', '1'];

      await search(req);

      expect(searchForUsers.mock.calls).toHaveLength(1);
      expect(searchForUsers.mock.calls[0][4]).toMatchObject({
        statusId: ['-1', '1'],
      });
    });

    test('then it should filter by service if specified', async () => {
      req.body.service = ['svc1', 'svc2'];

      await search(req);

      expect(searchForUsers.mock.calls).toHaveLength(1);
      expect(searchForUsers.mock.calls[0][4]).toMatchObject({
        services: ['svc1', 'svc2'],
        statusId: [],
        organisationCategories: [],
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
        user: {
          sub: 'user1',
          email: 'user.one@unit.test',
        },
      };
      req.session = jest.fn().mockReturnValue({ params: { ...req.query, redirectedFromOrganisations: true } });
    });

    test('then it should include the users from the adapter using supplier criteria', async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        users: usersSearchResult.users,
      });
      expect(searchForUsers.mock.calls[0][0]).toBe('test*');
    });

    test('then it should not search and return validation error if criteria does not meet minimum length', async () => {
      req.query.criteria = '';

      const result = await search(req);

      expect(searchForUsers).not.toHaveBeenCalled();
      expect(result).toEqual({
        validationMessages: {
          criteria: 'Please enter at least 4 characters',
        },
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
      expect(searchForUsers.mock.calls[0][1]).toBe(1);
    });

    test('then it should use page number from query if specified', async () => {
      req.query.page = 2;

      const actual = await search(req);

      expect(actual).toMatchObject({
        page: 2,
      });
      expect(searchForUsers.mock.calls[0][1]).toBe(2);
    });

    test('then it should include number of pages from search result', async () => {
      const actual = await search(req);

      expect(actual).toMatchObject({
        numberOfPages: 3,
      });
    });

    test('then it should audit that a search has occured', async () => {
      await search(req);

      expect(logger.audit.mock.calls).toHaveLength(1);
      expect(logger.audit.mock.calls[0][0]).toBe('user.one@unit.test (id: user1) searched for users in support using criteria "test"');
      expect(logger.audit.mock.calls[0][1]).toMatchObject({
        type: 'support',
        subType: 'user-search',
        userId: 'user1',
        userEmail: 'user.one@unit.test',
        criteria: 'test',
        pageNumber: 1,
        numberOfPages: 3,
      });
    });

    test('then it should default to sort by name if not specified', async () => {
      const actual = await search(req);

      expect(actual.sort.name.nextDirection).toBe('desc');
      expect(actual.sort.name.applied).toBe(true);
      expect(searchForUsers.mock.calls[0][2]).toBe('name');
      expect(searchForUsers.mock.calls[0][3]).toBe('asc');
    });

    test('then it should use sort order specified', async () => {
      req.query.sort = 'email';
      req.query.sortdir = 'desc';

      const actual = await search(req);

      expect(actual.sort.email.nextDirection).toBe('asc');
      expect(actual.sort.email.applied).toBe(true);
      expect(searchForUsers.mock.calls[0][2]).toBe('email');
      expect(searchForUsers.mock.calls[0][3]).toBe('desc');
    });
  });
});
