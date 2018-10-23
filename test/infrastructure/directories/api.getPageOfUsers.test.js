jest.mock('login.dfe.request-promise-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  directories: {
    type: 'api',
    service: {
      url: 'http://directories.test',
    },
  },
}));

const rp = jest.fn();
const requestPromise = require('login.dfe.request-promise-retry');
requestPromise.defaults.mockReturnValue(rp);

const jwtStrategy = require('login.dfe.jwt-strategies');
const { getPageOfUsers } = require('./../../../src/infrastructure/directories/api');

const pageNumber = 1;
const pageSize = 123;
const correlationId = 'abc123';
const apiResponse = {
  users: [],
  numberOfPages: 1,
};

describe('when getting a page of users from directories api', () => {
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

  it('then it should call users resource with page & page size', async () => {
    await getPageOfUsers(pageNumber, pageSize, false, false, false, undefined, correlationId);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      uri: 'http://directories.test/users?page=1&pageSize=123',
    });
  });

  it('then it should call users resource with page and include if includeDevices = true', async () => {
    await getPageOfUsers(pageNumber, pageSize, true, false, false, undefined, correlationId);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      uri: 'http://directories.test/users?page=1&pageSize=123&include=devices',
    });
  });

  it('then it should call users resource with page and include if includeCodes = true', async () => {
    await getPageOfUsers(pageNumber, pageSize, false, true, false, undefined, correlationId);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      uri: 'http://directories.test/users?page=1&pageSize=123&include=codes',
    });
  });

  it('then it should call users resource with page and include if includeLegacyUsernames = true', async () => {
    await getPageOfUsers(pageNumber, pageSize, false, false, true, undefined, correlationId);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      uri: 'http://directories.test/users?page=1&pageSize=123&include=legacyusernames',
    });
  });

  it('then it should call users resource with page and include if includeDevices = true and includeCodes = true and includeLegacyUsernames = true', async () => {
    await getPageOfUsers(pageNumber, pageSize, true, true, true, undefined, correlationId);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      uri: 'http://directories.test/users?page=1&pageSize=123&include=devices,codes,legacyusernames',
    });
  });

  it('then it should call users resource with page and changedAfter if changedAfter specified', async () => {
    await getPageOfUsers(pageNumber, pageSize, false, false, false, new Date(Date.UTC(2018, 8, 7, 10, 43, 32)), correlationId);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      uri: 'http://directories.test/users?page=1&pageSize=123&changedAfter=2018-09-07T10:43:32.000Z',
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await getPageOfUsers(pageNumber, pageSize, false, false, false, undefined, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await getPageOfUsers(pageNumber, pageSize, false, false, false, undefined, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });
});
