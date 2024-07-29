jest.mock('login.dfe.async-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  directories: {
    type: 'api',
    service: {
      url: 'http://directories.test',
    },
  },
}));

const {fetchApi} = require('login.dfe.async-retry');

const jwtStrategy = require('login.dfe.jwt-strategies');
const { getUsersById } = require('./../../../src/infrastructure/directories/api');

const correlationId = 'abc123';
const apiResponse = {
  users: [],
  numberOfPages: 1,
};
const userIds = ['user1', 'user2'];

describe('when getting a page of users from directories api', () => {
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


  it('then it calls directories api with Ids', async () => {
    await getUsersById(userIds, correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('http://directories.test/users/by-ids?id=user1,user2');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'GET'
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await getUsersById(userIds, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await getUsersById(userIds, correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });
});
