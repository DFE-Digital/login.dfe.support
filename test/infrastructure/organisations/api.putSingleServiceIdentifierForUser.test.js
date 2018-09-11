jest.mock('login.dfe.request-promise-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  organisations: {
    type: 'api',
    service: {
      url: 'http://organisations.test',
    },
  },
}));

const rp = jest.fn();
const requestPromise = require('login.dfe.request-promise-retry');
requestPromise.defaults.mockReturnValue(rp);

const jwtStrategy = require('login.dfe.jwt-strategies');
const { putSingleServiceIdentifierForUser } = require('./../../../src/infrastructure/organisations/api');

const userId = 'user-1';
const serviceId = 'service-1';
const orgId = 'org-1';
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

  it('then it should call put on organisation identifiers resource with user id, service id and orgid', async () => {
    await putSingleServiceIdentifierForUser(userId, serviceId,orgId, '123456', correlationId);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'PUT',
      uri: `http://organisations.test/organisations/${orgId}/services/${serviceId}/identifiers/${userId}`,
      body: {
        id_key: 'k2s-id',
        id_value: '123456',
      }
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await putSingleServiceIdentifierForUser(userId, serviceId,orgId, '123456', correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await putSingleServiceIdentifierForUser(userId, serviceId,orgId, '123456', correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });
});
