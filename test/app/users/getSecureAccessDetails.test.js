jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/app/users/utils');
jest.mock('./../../../src/infrastructure/directories');

const { getUserDetails } = require('./../../../src/app/users/utils');
const { getLegacyUsernames } = require('./../../../src/infrastructure/directories');
const getSecureAccessDetails = require('./../../../src/app/users/getSecureAccessDetails');

describe('when getting users secure access details', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      id: 'correlationId',
      csrfToken: () => 'token',
      accepts: () => ['text/html'],
      user: {
        sub: 'user1',
        email: 'super.user@unit.test',
      },
      params: {
        uid: 'user1',
      },
      session: {},
    };

    res = {
      render: jest.fn(),
    };
    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: 'user1',
    });

    getLegacyUsernames.mockReset();
    getLegacyUsernames.mockReturnValue({
      legacy_username: 'username123',
      createdAt: '01-02-2017',
    })
  });

  it('then it should get user details', async () => {
    await getSecureAccessDetails(req, res);

    expect(getUserDetails.mock.calls).toHaveLength(1);
    expect(getUserDetails.mock.calls[0][0]).toBe(req);
    expect(res.render.mock.calls[0][1].user).toMatchObject({
      id: 'user1',
    });
  });

  it('then it should get secure access details for user', async () => {
    await getSecureAccessDetails(req, res);

    expect(getLegacyUsernames.mock.calls).toHaveLength(1);
    expect(getLegacyUsernames.mock.calls[0][0]).toBe('user1');
    expect(getLegacyUsernames.mock.calls[0][1]).toBe('correlationId');

    expect(res.render.mock.calls[0][1].secureAccessDetails).toMatchObject({
      legacy_username: 'username123',
      createdAt: '01-02-2017',
    });
  });

});
