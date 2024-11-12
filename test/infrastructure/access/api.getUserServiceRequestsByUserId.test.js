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
const { getUserServiceRequestsByUserId } = require('../../../src/infrastructure/access/api');

const userId = 'user-1';
const correlationId = 'abc123';
const apiResponse = [{
  "id": "88a1ed39-5a98-43da-b66e-78e564ea72b0",
  "userId": "01A52B72-AE88-47BC-800B-E7DFFCE54344",
  "serviceId": "7B7E2D82-1228-4547-907C-40A2A35D0704",
  "organisationId": "11BE2E1F-4227-4FDE-81D9-14B1E3322D48",
  "status": 2,
  "createdAt": "2024-06-04T09:47:36.718Z",
  "updatedAt": "2024-06-09T00:00:00.173Z",
  "requestType": "service"
}];

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


  it('then it should call services associated-with-user resource with user id', async () => {
    await getUserServiceRequestsByUserId(userId, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('http://access.test/users/user-1/service-requests');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'GET'
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await getUserServiceRequestsByUserId(userId, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await getUserServiceRequestsByUserId(userId, correlationId);

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

    const result = await getUserServiceRequestsByUserId(userId, correlationId);
    expect(result).toEqual(undefined);
  });

  it('should raise an exception on any failure status code that is not 404', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Client Error');
      error.statusCode = 400;
      throw error;
    });

    try {
      await getUserServiceRequestsByUserId(userId, correlationId);
    } catch (e) {
      expect(e.statusCode).toEqual(400);
      expect(e.message).toEqual('Client Error');
    }
  });
});
