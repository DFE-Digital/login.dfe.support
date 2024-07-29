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
jest.mock('login.dfe.async-retry');
jest.mock('login.dfe.jwt-strategies', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getBearerToken: jest.fn().mockReturnValue('token'),
    };
  });
});

const {fetchApi} = require('login.dfe.async-retry');

const { updateUser } = require('./../../../src/infrastructure/directories/api');

describe('When updating a user using the api', () => {
  beforeEach(() => {
    fetchApi.mockReset();
  });


  it('then it should PATCH user at api', async () => {
    await updateUser('user1', 'Hermione', 'Granger', 'correlation-id');

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('https://directories.api.test/users/user1');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'PATCH'
    });
  });

  it('then it should authorize using the bearer token', async () => {
    await updateUser('user1', 'Hermione', 'Granger', 'correlation-id');

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include correlation id', async () => {
    await updateUser('user1', 'Hermione', 'Granger', 'correlation-id');

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        'x-correlation-id': 'correlation-id',
      },
    });
  });

  it('then it should include given_name if value passed', async () => {
    await updateUser('user1', 'Hermione', 'Granger', 'correlation-id');

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      body: {
        given_name: 'Hermione'
      },
    });
  });

  it('then it should not include given_name if value not passed', async () => {
    await updateUser('user1', null, 'Granger', 'correlation-id');

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0].given_name).toBeUndefined();
  });

  it('then it should include family_name if value passed', async () => {
    await updateUser('user1', 'Hermione', 'Granger', 'correlation-id');

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      body: {
        family_name: 'Granger'
      },
    });
  });

  it('then it should not include given_name if value not passed', async () => {
    await updateUser('user1', 'Hermione', null, 'correlation-id');

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][1].family_name).toBeUndefined();
  });
});
