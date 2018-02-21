

const get = require('../../../src/app/userDevices/getUnlockToken');

describe('When processing a get to unlock a device', () => {
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

  test('then it should render the unlock token view', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][0]).toBe('userDevices/views/unlockToken');
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