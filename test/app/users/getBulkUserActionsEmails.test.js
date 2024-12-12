jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory({}));
jest.mock('./../../../src/app/users/utils');

const { searchForBulkUsersPage } = require('../../../src/app/users/utils');
const getBulkUserActionsEmails = require('../../../src/app/users/getBulkUserActionsEmails');

describe('When processing a get for a bulk user action emails request', () => {
  let req;
  let res;

  const userSearchResult = [{
    id: '34080a9c-fd79-45a6-a092-4756264d5c85',
    name: 'User One',
    email: 'user.one@unit.test',
    organisation: {
      name: 'Testing school',
    },
    lastLogin: null,
    status: {
      description: 'Active',
    },
  }];

  beforeEach(() => {
    req = {
      method: 'GET',
      session: {
        emails: 'user.one@unit.test',
      },
      params: {},
      csrfToken: () => {
        return 'token';
      },
      accepts: () => {
        return ['text/html'];
      },
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    };

    searchForBulkUsersPage.mockReset().mockReturnValue(userSearchResult);
  });

  it('then it should render the buildUserActionsEmails view', async () => {
    await getBulkUserActionsEmails(req, res);

    expect(res.render.mock.calls[0][0]).toBe('users/views/bulkUserActionsEmails');
    expect(res.render.mock.calls[0][1]).toMatchObject(
      {
        csrfToken: 'token',
        users: userSearchResult,
        validationMessages: {},
      },
    );
  });

  it('then it should include csrf token', async () => {
    await getBulkUserActionsEmails(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('it should redirect back to /users if emails are not set in session', async () => {
    req = {
      method: 'GET',
      params: {},
      session: {},
      csrfToken: () => {
        return 'token';
      },
      accepts: () => {
        return ['text/html'];
      },
    };
    await getBulkUserActionsEmails(req, res);

    expect(res.redirect.mock.calls[0][0]).toBe('/users');
  });
});
