const getBulkUserActions = require('./../../../src/app/users/getBulkUserActions');

describe('When processing a get for a bulk user action request', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      method: 'GET',
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
    };
  });

  test('then it should render the userDevice view', async () => {
    await getBulkUserActions(req, res);

    expect(res.render.mock.calls[0][0]).toBe('users/views/bulkUserActions');
    expect(res.render.mock.calls[0][1]).toMatchObject(
      {
        csrfToken: 'token',
        emails: '',
        validationMessages: {},
      },
    );
  });

  test('then it should include csrf token', async () => {
    await getBulkUserActions(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });
});
