jest.mock('login.dfe.async-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory({
  applications: {
    type: 'api',
    service: {
      url: 'http://applications.test',
      retryFactor: 0,
      numberOfRetries: 2,
    },
  },
}));

const { fetchApi } = require('login.dfe.async-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');
const { getServiceById } = require('../../../src/infrastructure/applications/api');

const serviceId = 'service-1';
const apiResponse = [
  {
    userId: 'user-1',
    serviceId: 'service1Id',
    organisationId: 'organisation-1',
    roles: [],
  },
  {
    userId: 'user-1',
    serviceId: 'service2Id',
    organisationId: 'organisation-1',
    roles: [],
  },
];

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

  it('then it should return undefined if no id is provided', async () => {
    const blankServiceId = '';
    const result = await getServiceById(blankServiceId);

    expect(result).toBe(undefined);
    expect(fetchApi.mock.calls).toHaveLength(0);
  });

  it('then it should call users resource with user id', async () => {
    await getServiceById(serviceId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('http://applications.test/services/service-1');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'GET',
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await getServiceById(serviceId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await getServiceById(serviceId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('should return false on a 404 response', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Not found');
      error.statusCode = 404;
      throw error;
    });

    const result = await getServiceById(serviceId);
    expect(result).toEqual(undefined);
  });

  it('should raise an exception on any failure status code that is not 404', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Server Error');
      error.statusCode = 500;
      throw error;
    });

    const act = () => getServiceById(serviceId);

    await expect(act).rejects.toThrow(expect.objectContaining({
      message: 'Server Error',
      statusCode: 500,
    }));
  });
});
