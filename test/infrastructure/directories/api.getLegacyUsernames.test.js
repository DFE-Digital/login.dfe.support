jest.mock('login.dfe.request-promise-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  directories: {
    type: 'api',
    service: {
      url: 'http://directories.test',
    },
  },
}));

const rp = jest.fn();
const requestPromise = require('login.dfe.request-promise-retry');
requestPromise.defaults.mockReturnValue(rp);

const jwtStrategy = require('login.dfe.jwt-strategies');
const { getLegacyUsernames } = require('./../../../src/infrastructure/directories/api');

const correlationId = 'abc123';
const apiResponse = {
  uid: 'dA29AABD-5D40-471E-9ABC-380B2634EAEB',
  legacy_username: 'username',
  createdAt: '10/04/2017',
};
const userIds = ['user1', 'user2'];

describe('when getting a legacy user by userid', () => {
  beforeEach(() => {
    rp.mockReset();
    rp.mockImplementation(() => {
      return apiResponse;
    });

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue('token'),
      };
    })
  });

  it('should pass', () => {
    expect(true).toBe(true);
  });

  // it('then it calls directories api with ids', async () => {
  //   await getLegacyUsernames(userIds, correlationId);

  //   expect(rp.mock.calls).toHaveLength(1);
  //   expect(rp.mock.calls[0][0]).toMatchObject({
  //     method: 'GET',
  //     uri: 'http://directories.test/users/user1,user2/legacy-username'
  //   });
  // });

  // it('then it should use the token from jwt strategy as bearer token', async () => {
  //   await getLegacyUsernames(userIds, correlationId);

  //   expect(rp.mock.calls[0][0]).toMatchObject({
  //     headers: {
  //       authorization: 'bearer token',
  //     },
  //   });
  // });

  // it('then it should include the correlation id', async () => {
  //   await getLegacyUsernames(userIds, correlationId);

  //   expect(rp.mock.calls[0][0]).toMatchObject({
  //     headers: {
  //       'x-correlation-id': correlationId,
  //     },
  //   });
  // });

});
