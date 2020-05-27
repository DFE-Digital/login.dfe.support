jest.mock('login.dfe.request-promise-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  organisations: {
    type: 'api',
    service: {
      url: 'http://organisations.test',
      retryFactor: 0,
      numberOfRetries: 2,
    },
  },
}));

const rp  = require('login.dfe.request-promise-retry');

const jwtStrategy = require('login.dfe.jwt-strategies');
const { getServicesByUserId } = require('./../../../src/infrastructure/organisations/api');

const userId = 'user-1';
const correlationId = 'abc123';
const apiResponse = {
  users: [],
  numberOfPages: 1,
};

describe('when getting a users services mapping from api', () => {
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


  it('then it should call services associated-with-user resource with user id', async () => {
    await getServicesByUserId(userId, correlationId);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      uri: 'http://organisations.test/services/associated-with-user/user-1',
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await getServicesByUserId(userId, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await getServicesByUserId(userId, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });
});
