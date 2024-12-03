jest.mock('login.dfe.async-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory({
  search: {
    type: 'api',
    service: {
      url: 'http://search.test',
    },
  },
}));

const { fetchApi } = require('login.dfe.async-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');
const { getSearchDetailsForUserById } = require('../../../src/infrastructure/search/api');

const userId = 'user-1';
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
    await getSearchDetailsForUserById(userId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('http://search.test/users/user-1');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'GET',
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await getSearchDetailsForUserById(userId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  // This function should be updated to allow a correlationId to be passed in
  it('should always have an undefined correlationId', async () => {
    await getSearchDetailsForUserById(userId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        'x-correlation-id': undefined,
      },
    });
  });

  it('should return undefined on a 400 response', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Client Error');
      error.statusCode = 400;
      throw error;
    });

    const result = await getSearchDetailsForUserById(userId);
    expect(result).toEqual(undefined);
  });

  it('should return undefined on a 403 response', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('forbidden');
      error.statusCode = 403;
      throw error;
    });

    const result = await getSearchDetailsForUserById(userId);
    expect(result).toEqual(undefined);
  });

  it('should return undefined on a 400 response', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Client Error');
      error.statusCode = 400;
      throw error;
    });

    const result = await getSearchDetailsForUserById(userId);
    expect(result).toEqual(undefined);
  });

  it('should return undefined on a 403 response', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Forbidden');
      error.statusCode = 403;
      throw error;
    });

    const result = await getSearchDetailsForUserById(userId);
    expect(result).toEqual(undefined);
  });

  it('should return undefined on a 404 response', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Not found');
      error.statusCode = 404;
      throw error;
    });

    const result = await getSearchDetailsForUserById(userId);
    expect(result).toEqual(undefined);
  });

  it('should raise an exception on any failure status code that is not 400, 403, 404', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Server Error');
      error.statusCode = 500;
      throw error;
    });

    const act = () => getSearchDetailsForUserById(userId);

    await expect(act).rejects.toThrow(expect.objectContaining({
      name: 'Error',
      message: 'Error getting user user-1 from search - Server Error',
    }));
  });
});
