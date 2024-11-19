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
const { searchForUsers } = require('../../../src/infrastructure/search/api');

const criteria = 'testCriteria';
const pageNumber = 1;
const sortBy = '';
const sortDirection = '';
const filters = '';
const apiResponse = {
  users: [],
  numberOfPages: 1,
};

describe('when searching for users', () => {
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
    await searchForUsers(criteria, pageNumber, sortBy, sortDirection, filters);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('http://search.test/users?criteria=testCriteria&page=1');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'GET',
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await searchForUsers(criteria, pageNumber, sortBy, sortDirection, filters);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  // This function should be updated to allow a correlationId to be passed in
  it('should always have an undefined correlationId', async () => {
    await searchForUsers(criteria, pageNumber, sortBy, sortDirection, filters);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        'x-correlation-id': undefined,
      },
    });
  });

  // This test is like this because it doesn't handle failure properly.  The code assumes it'll always get an object back and doesn't properly
  // handle it when an undefined is returned. This needs to be improved.
  it('should raise an exception when a 400 is returned', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Client Error');
      error.statusCode = 400;
      throw error;
    });

    const act = () => searchForUsers(criteria, pageNumber, sortBy, sortDirection, filters);

    await expect(act).rejects.toThrow(expect.objectContaining({
      name: 'Error',
      message: 'Error searching for users with criteria testCriteria (page: 1) - Cannot read properties of undefined (reading \'numberOfPages\')',
    }));
  });

  // This test is like this because it doesn't handle failure properly.  The code assumes it'll always get an object back and doesn't properly
  // handle it when an undefined is returned. This needs to be improved.
  it('should raise an exception when a 403 is returned', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Forbidden');
      error.statusCode = 403;
      throw error;
    });

    const act = () => searchForUsers(criteria, pageNumber, sortBy, sortDirection, filters);

    await expect(act).rejects.toThrow(expect.objectContaining({
      name: 'Error',
      message: 'Error searching for users with criteria testCriteria (page: 1) - Cannot read properties of undefined (reading \'numberOfPages\')',
    }));
  });

  // This test is like this because it doesn't handle failure properly.  The code assumes it'll always get an object back and doesn't properly
  // handle it when an undefined is returned. This needs to be improved.
  it('should raise an exception when a 404 is returned', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Not found');
      error.statusCode = 404;
      throw error;
    });

    const act = () => searchForUsers(criteria, pageNumber, sortBy, sortDirection, filters);

    await expect(act).rejects.toThrow(expect.objectContaining({
      name: 'Error',
      message: 'Error searching for users with criteria testCriteria (page: 1) - Cannot read properties of undefined (reading \'numberOfPages\')',
    }));
  });

  it('should raise an exception with an Error message on any failure status code that is not 400, 403, 404', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Server Error');
      error.statusCode = 500;
      throw error;
    });

    const act = () => searchForUsers(criteria, pageNumber, sortBy, sortDirection, filters);

    await expect(act).rejects.toThrow(expect.objectContaining({
      name: 'Error',
      message: 'Error searching for users with criteria testCriteria (page: 1) - Server Error',
    }));
  });
});
