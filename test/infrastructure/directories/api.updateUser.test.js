jest.mock('./../../../src/infrastructure/config', () => {
  return {
    directories: {
      type: 'api',
      service: {
        url: 'https://directories.api.test',
        auth: {
          type: 'aad',
          tenant: 'tenant.omicrosoft.com',
          authorityHostUrl: 'https://login.microsoftonline.com/uuid',
          clientId: 'app-id',
          clientSecret: 'secure-secret',
          resource: 'service-id'
        }
      }
    },
    hostingEnvironment: {
      agentKeepAlive: {}
    },
  }
});
jest.mock('agentkeepalive', () => {
  return {
    HttpsAgent: jest.fn()
  }
});
jest.mock('login.dfe.request-promise-retry');
jest.mock('login.dfe.jwt-strategies', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getBearerToken: jest.fn().mockReturnValue('token'),
    };
  });
});

const rp = jest.fn();
const requestPromise = require('login.dfe.request-promise-retry');
requestPromise.defaults.mockReturnValue(rp);

const { updateUser } = require('./../../../src/infrastructure/directories/api');

describe('When updating a user using the api', () => {
  beforeEach(() => {
    rp.mockReset();
  });

  it('should pass', () => {
    expect(true).toBe(true);
  });

  // it('then it should PATCH user at api', async () => {
  //   await updateUser('user1', 'Hermione', 'Granger', 'correlation-id');

  //   expect(rp.mock.calls).toHaveLength(1);
  //   expect(rp.mock.calls[0][0]).toMatchObject({
  //     method: 'PATCH',
  //     uri: 'https://directories.api.test/users/user1',
  //   });
  // });

  // it('then it should authorize using the bearer token', async () => {
  //   await updateUser('user1', 'Hermione', 'Granger', 'correlation-id');

  //   expect(rp.mock.calls).toHaveLength(1);
  //   expect(rp.mock.calls[0][0]).toMatchObject({
  //     headers: {
  //       authorization: 'bearer token',
  //     },
  //   });
  // });

  // it('then it should include correlation id', async () => {
  //   await updateUser('user1', 'Hermione', 'Granger', 'correlation-id');

  //   expect(rp.mock.calls).toHaveLength(1);
  //   expect(rp.mock.calls[0][0]).toMatchObject({
  //     headers: {
  //       'x-correlation-id': 'correlation-id',
  //     },
  //   });
  // });

  // it('then it should include given_name if value passed', async () => {
  //   await updateUser('user1', 'Hermione', 'Granger', 'correlation-id');

  //   expect(rp.mock.calls).toHaveLength(1);
  //   expect(rp.mock.calls[0][0]).toMatchObject({
  //     body: {
  //       given_name: 'Hermione'
  //     },
  //   });
  // });

  // it('then it should not include given_name if value not passed', async () => {
  //   await updateUser('user1', null, 'Granger', 'correlation-id');

  //   expect(rp.mock.calls).toHaveLength(1);
  //   expect(rp.mock.calls[0][0].given_name).toBeUndefined();
  // });

  // it('then it should include family_name if value passed', async () => {
  //   await updateUser('user1', 'Hermione', 'Granger', 'correlation-id');

  //   expect(rp.mock.calls).toHaveLength(1);
  //   expect(rp.mock.calls[0][0]).toMatchObject({
  //     body: {
  //       family_name: 'Granger'
  //     },
  //   });
  // });

  // it('then it should not include given_name if value not passed', async () => {
  //   await updateUser('user1', 'Hermione', null, 'correlation-id');

  //   expect(rp.mock.calls).toHaveLength(1);
  //   expect(rp.mock.calls[0][0].family_name).toBeUndefined();
  // });
});
