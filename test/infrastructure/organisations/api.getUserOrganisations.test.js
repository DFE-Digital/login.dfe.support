jest.mock('login.dfe.async-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  organisations: {
    type: 'api',
    service: {
      url: 'http://organisations.test',
    },
  },
}));

const {fetchApi} = require('login.dfe.async-retry');

const jwtStrategy = require('login.dfe.jwt-strategies');
const { getUserOrganisations } = require('./../../../src/infrastructure/organisations/api');

const userId = 'user-1';
const correlationId = 'abc123';
const apiResponse = {
  users: [],
  numberOfPages: 1,
};

describe('when getting a users organisations mapping from api', () => {
  beforeEach(() => {
    fetchApi.mockReset();
    fetchApi.mockImplementation(() => {
      return apiResponse;
    });

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue('token'),
      };
    })
  });



  it('then it should call associated-with-user resource with user id', async () => {
    await getUserOrganisations(userId, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('http://organisations.test/organisations/associated-with-user/user-1');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'GET'
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await getUserOrganisations(userId, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await getUserOrganisations(userId, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });
});
