jest.mock('login.dfe.async-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('../../utils').configMockFactory({
  organisations: {
    type: 'api',
    service: {
      url: 'http://organisations.test',
    },
  },
}));

const {fetchApi} = require('login.dfe.async-retry');

const jwtStrategy = require('login.dfe.jwt-strategies');
const { getAllOrganisations } = require('../../../src/infrastructure/organisations/api');

const userId = 'user-1';
const correlationId = 'abc123';
const apiResponse = {
  organisations: [],
  totalNumberOfPages: 1,
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
    await getAllOrganisations(userId, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('http://organisations.test/organisations?page=1');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'GET',
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await getAllOrganisations(userId, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await getAllOrganisations(userId, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        'x-correlation-id': undefined,
      },
    });
  });

  it('should return a TypeError on a status 401 from the api', async () => {
    // Returns a TypeError because the function doesn't handle errors appropriately and always
    // assumes the return value object with an 'organisations' field whos value is an iterable.
    // This needs to be improved.
    fetchApi.mockImplementation(() => {
      const error = new Error('Unauthorzed');
      error.statusCode = 401;
      throw error;
    });

    try {
      await getAllOrganisations(userId, correlationId);
    } catch (e) {
      expect(e).toBeInstanceOf(TypeError);
      expect(e.message).toEqual('Cannot read properties of null (reading \'organisations\')');
    }
  });

  it('should return a TypeError on a status 404 from the api', async () => {
    // Returns a TypeError because the function doesn't handle errors appropriately and always
    // assumes the return value object with an 'organisations' field whos value is an iterable.
    // This needs to be improved.
    fetchApi.mockImplementation(() => {
      const error = new Error('Not found');
      error.statusCode = 404;
      throw error;
    });

    try {
      await getAllOrganisations(userId, correlationId);
    } catch (e) {
      expect(e).toBeInstanceOf(TypeError);
      expect(e.message).toEqual('Cannot read properties of null (reading \'organisations\')');
    }
  });

  it('should return a TypeError on a status 409 from the api', async () => {
    // Returns a TypeError because the function doesn't handle errors appropriately and always
    // assumes the return value object with an 'organisations' field whos value is an iterable.
    // This needs to be improved.
    fetchApi.mockImplementation(() => {
      const error = new Error('Conflict');
      error.statusCode = 409;
      throw error;
    });

    try {
      await getAllOrganisations(userId, correlationId);
    } catch (e) {
      expect(e).toBeInstanceOf(TypeError);
      expect(e.message).toEqual('Cannot read properties of undefined (reading \'forEach\')');
    }
  });

  it('should raise an exception on any failure status code that is not 401, 404 or 409', async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error('Server Error');
      error.statusCode = 500;
      throw error;
    });

    try {
      await getAllOrganisations(userId, correlationId);
    } catch (e) {
      expect(e.statusCode).toEqual(500);
      expect(e.message).toEqual('Server Error');
    }
  });
});
