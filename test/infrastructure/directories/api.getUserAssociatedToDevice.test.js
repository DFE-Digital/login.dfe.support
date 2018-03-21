jest.mock('request-promise');
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
const requestPromise = require('request-promise');
requestPromise.defaults.mockReturnValue(rp);

const jwtStrategy = require('login.dfe.jwt-strategies');
const { getUserAssociatedToDevice } = require('./../../../src/infrastructure/directories/api');

const correlationId = 'abc123';
const type = 'digipass';
const serialNumber = '1234567890';
const apiResponse = {
  associatedWith: {
    type: 'user',
    sub: 'user1',
  }
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

  it('then it should call devices resource with type and serial number', async () => {
    await getUserAssociatedToDevice(type, serialNumber, correlationId);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      uri: 'http://directories.test/devices/digipass/1234567890',
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await getUserAssociatedToDevice(type, serialNumber, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await getUserAssociatedToDevice(type, serialNumber, correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });

  it('then it should return associated user sub if associated', async () => {
    const actual = await getUserAssociatedToDevice(type, serialNumber, correlationId);

    expect(actual).toEqual({
      type: 'user',
      sub: 'user1',
    });
  });

  it('then it should return null if not associated', async () => {
    rp.mockImplementation(() => {
      const notFound = new Error('not found');
      notFound.statusCode = 404;
      throw notFound;
    });

    const actual = await getUserAssociatedToDevice(type, serialNumber, correlationId);

    expect(actual).toBeNull();
  });
});
