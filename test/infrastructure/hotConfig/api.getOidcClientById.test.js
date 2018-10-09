jest.mock('login.dfe.request-promise-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('agentkeepalive', () => ({
  HttpsAgent: jest.fn(),
}));
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  hotConfig: {
    type: 'api',
    service: {
      url: 'http://unit.test.local',
    },
  },
}));

const requestPromise = require('login.dfe.request-promise-retry');
const rp = jest.fn();
requestPromise.defaults.mockReturnValue(rp);
const jwtStrategy = require('login.dfe.jwt-strategies');
const { getOidcClientById } = require('./../../../src/infrastructure/hotConfig/api');


describe('When getting an OIDC client by id from hot config', () => {
  beforeEach(() => {
    rp.mockReset().mockImplementation((opts) => {
      if (opts.uri.endsWith('client1')) {
        return {
          client_id: 'client1',
          client_secret: 'some-secure-secret',
          redirect_uris: [
            'https://client.one/auth/cb',
            'https://client.one/register/complete',
          ],
          post_logout_redirect_uris: [
            'https://client.one/signout/complete',
          ],
        };
      }

      const notFoundError = new Error('Not found');
      notFoundError.statusCode = 404;
      throw notFoundError;
    });

    jwtStrategy.mockReset().mockImplementation(() => ({
      getBearerToken: () => 'bearer-token',
    }));
  });

  it('then it should return client when found in hot config', async () => {
    const actual = await getOidcClientById('client1');

    expect(actual).toEqual({
      client_id: 'client1',
      client_secret: 'some-secure-secret',
      redirect_uris: [
        'https://client.one/auth/cb',
        'https://client.one/register/complete',
      ],
      post_logout_redirect_uris: [
        'https://client.one/signout/complete',
      ],
    });
  });

  it('then it should return null when not found in hot config', async () => {
    const actual = await getOidcClientById('client2');

    expect(actual).toBeUndefined();
  });

  it('then it should return null when id parameter not defined', async () => {
    const actual = await getOidcClientById(undefined);

    expect(actual).toBeUndefined();
  });

  it('then it should get client by id from api', async () => {
    await getOidcClientById('client1');

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      uri: 'http://unit.test.local/oidcclients/client1',
    });
  });

  it('then it should authorize api call with bearer token', async () => {
    await getOidcClientById('client1');

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        authorization: 'bearer bearer-token',
      },
    });
  });
});