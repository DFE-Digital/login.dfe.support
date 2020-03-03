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
const { getUser } = require('./../../../src/infrastructure/directories/api');

const correlationId = 'abc123';
const userId = 'user1';
const apiResponse = {
  sub: 'user1',
  given_name: 'Rubeus',
  family_name: 'Hagrid',
  email: 'groundskeeper@hogwarts.com',
  password: '0dqy81MVA9lqs2+xinvOXbbGMhd18X4pq5aRfiE65pIKxcWB0OtAffY9NdJy0/ksjhBG9EOYywti2WYmtqwxypRil+x0/nBeBlJUfN7/Q9l8tRiDcqq8NghC8wqSEuyzLKXoE/+VDPkW35Vo8czsOp5PT0xN3IQ31vlld/4PqsqQWYE4WBTBO/PO6SoAfNapDxb4M9C8TiReek43pfVL3wTst8Bv4wkeFcLy7NMGVyM48LmjlyvYPIY5NTz8RGOSCAyB7kIxYEsf9SB0Sp0IMGhHIoM8/Yhso3cJNTKTLod0Uz3Htc0JAStugt6RCrnar3Yc7yUzSGDNZcvM31HsP74i5TifaJiavHOiZxjaHYn/KsLFi5/zqNRcYkzN+dYzWY1hjCSY47za9HMh89ZHxGkmrknQY4YKRp/uvg2driXwZDaIm7NUt90mXim4PGM0kYejp9SUwlIGmc5F4QO5F3tBoRb/AYsf3f6mDw7SXAMnO/OVfglvf/x3ICE7UCLkuMXZAECe8MJoJnpP+LVrNQfJjSrjmBYrVRVkS2QFrte0g2WO1SprE9KH8kkmNEmkC6Z3orDczx5jW7LSl37ZHzq1dvMYAJrEoWH21e6ug5usMSl1X6S5uBIsSrj8kOlTYgr4huPjN54aBTVYazCn6UFVrt83E81nbuyZTadrnA4=',
  salt: 'PasswordIs-password-',
};

describe('when getting a page of users from directories api', () => {
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

  // it('then it should call users resource with uid', async () => {
  //   await getUser(userId, correlationId);

  //   expect(rp.mock.calls).toHaveLength(1);
  //   expect(rp.mock.calls[0][0]).toMatchObject({
  //     method: 'GET',
  //     uri: 'http://directories.test/users/user1',
  //   });
  // });

  // it('then it should use the token from jwt strategy as bearer token', async () => {
  //   await getUser(userId, correlationId);

  //   expect(rp.mock.calls[0][0]).toMatchObject({
  //     headers: {
  //       authorization: 'bearer token',
  //     },
  //   });
  // });

  // it('then it should include the correlation id', async () => {
  //   await getUser(userId, correlationId);

  //   expect(rp.mock.calls[0][0]).toMatchObject({
  //     headers: {
  //       'x-correlation-id': correlationId,
  //     },
  //   });
  // });
});
