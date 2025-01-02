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
const { searchForBulkUsersPage } = require('../../../src/app/users/utils');

describe('When processing a user search request', () => {
  let usersSearchResult;
  const email = 'test@test.com';

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
      numberOfPages: 1,
    };
    searchForUsers.mockReset().mockReturnValue(usersSearchResult);

    logger.audit.mockReset();
  });

  describe('and the request is a GET', () => {
    let req;

    beforeEach(() => {
      req = {
        method: 'GET',
        user: {
          sub: 'user1',
          email: 'user.one@unit.test',
        },
      };
      req.session = jest.fn().mockReturnValue({ params: { ...req.query, redirectedFromOrganisations: true } });
    });

    test('then it should include the users from the adapter using supplier criteria', async () => {
      const actual = await searchForBulkUsersPage(email);

      expect(actual).toMatchObject({
        users: usersSearchResult.users,
      });
      expect(searchForUsers.mock.calls[0][0]).toBe('test@test.com*');
    });

    test('then it should include posted criteria', async () => {
      const actual = await searchForBulkUsersPage(email);
      expect(actual).toMatchObject({ users: usersSearchResult.users });
    });
  });
});
