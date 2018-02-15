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

const get = require('./../../../src/app/userDevices/getResyncToken');

describe('When processing a get to resync a device', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      method: 'GET',
      params: {
        uid: 'test',
        serialNumber: '123456',
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


  });

  test('then it should render the resync token view', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][0]).toBe('userDevices/views/resyncToken');
  });

  test('then it should include csrf token', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });


  test('then it should include serial number and user id details', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      serialNumber: '123456',
      uid: 'test',
    });
  });

});