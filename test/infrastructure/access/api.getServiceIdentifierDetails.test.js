jest.mock('login.dfe.async-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory({
  access: {
    type: 'api',
    service: {
      url: 'http://access.test',
      retryFactor: 0,
      numberOfRetries: 2,
    },
  },
}));

const {fetchApi} = require('login.dfe.async-retry');

const jwtStrategy = require('login.dfe.jwt-strategies');
const { getServiceIdentifierDetails } = require('../../../src/infrastructure/access/api');

const serviceId = 'service-1';
const identifierKey = 'identifier-key-1';
const identifierValue = 'idenfier-value-1';
const correlationId = 'abc123';
const apiResponse = jest.fn();

describe('when getting a users services mapping from api', () => {
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


  it('then it should call users resource with user id', async () => {
    await getServiceIdentifierDetails(serviceId, identifierKey, identifierValue, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('http://access.test/services/service-1/users?filteridkey=identifier-key-1&filteridvalue=idenfier-value-1');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'GET'
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await getServiceIdentifierDetails(serviceId, identifierKey, identifierValue, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await getServiceIdentifierDetails(serviceId, identifierKey, identifierValue, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });

  it('should return false on a 404 response', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('not found');
      error.statusCode = 404;
      throw error;
    });

    const result = await getServiceIdentifierDetails(serviceId, identifierKey, identifierValue, correlationId);
    expect(result).toEqual(undefined);
  });

  it('should raise an exception on any failure status code that is not 404', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Client Error');
      error.statusCode = 400;
      throw error;
    });

    try {
      await getServiceIdentifierDetails(serviceId, identifierKey, identifierValue, correlationId);
    } catch (e) {
      expect(e.statusCode).toEqual(400);
      expect(e.message).toEqual('Client Error');
    }
  });
});