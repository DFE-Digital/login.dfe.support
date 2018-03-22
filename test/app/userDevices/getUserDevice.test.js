jest.mock('./../../../src/app/userDevices/utils', () => {
  return {
    getUserTokenDetails: jest.fn().mockReturnValue({
      uid: 'afed345tgb678',
      serialNumber: '123test456',
      serialNumberFormatted: '123-test-456',
      name: 'Mr Test Testing',
      orgName: "My Org",
      lastLogin: '16:00:00  06/10/2017',
      numberOfSuccessfulLoginAttemptsInTwelveMonths: '25',
      tokenStatus: 'Active',
      audit:{audits: [{
        date:  '16:10:00  07/10/2017',
        event:'Login',
        result:'Success',
        user: 'Testing Tester',
      }]},
    }),
  };
});

const utils = require('./../../../src/app/userDevices/utils');
const get = require('./../../../src/app/userDevices/getUserDevice');

describe('When processing a get for a user device', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      method: 'GET',
      params: {
        uid: '123-456-789',
        serialNumber: 'test',
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

  test('then it should render the userDevice view', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][0]).toBe('userDevices/views/userDevice');
  });

  test('then it should include csrf token', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      csrfToken: 'token',
    });
  });

  it('then the req is passed onto the getTokenDetails function', async () => {
    await get(req, res);

    expect(utils.getUserTokenDetails.mock.calls).toHaveLength(1);
    expect(utils.getUserTokenDetails.mock.calls[0][0]).toMatchObject(req, req.params);
  });

  test('then it should include page details', async () => {
    await get(req, res);

    expect(res.render.mock.calls[0][1]).toMatchObject({
      uid: 'afed345tgb678',
      serialNumberFormatted: '123-test-456',
      serialNumber: '123test456',
      name: 'Mr Test Testing',
      orgName: "My Org",
      lastLogin: '16:00:00  06/10/2017',
      numberOfSuccessfulLoginAttemptsInTwelveMonths: '25',
      tokenStatus: 'Active',
      audit: [{
        date:  '16:10:00  07/10/2017',
        event:'Login',
        result:'Success',
        user: 'Testing Tester',
      }],
    });
  });

});