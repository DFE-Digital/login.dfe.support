jest.mock('request-promise');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  devices: {
    type: 'api',
    service: {
      url: 'http://devices.test',
    },
  },
}));

const rp = require('request-promise');
const jwtStrategy = require('login.dfe.jwt-strategies');
const { deviceExists } = require('./../../../src/infrastructure/devices/api');

const correlationId = 'abc123';

describe('when getting a page of digipass tokens from the devices api', () => {
  beforeEach(() => {
    rp.mockReset();
    rp.mockImplementation(() => {
      return {
        statusCode: 204,
      };
    });

    jwtStrategy.mockReset();
    jwtStrategy.mockImplementation(() => {
      return {
        getBearerToken: jest.fn().mockReturnValue('token'),
      };
    })
  });

  it('then it should call digipass resource with serial number', async () => {
    await deviceExists('123456789', correlationId);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      uri: 'http://devices.test/digipass/123456789',
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await deviceExists('123456789', correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await deviceExists('123456789', correlationId);

    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });

  it('then true is returned if api returns 204', async () => {
    const actual = await deviceExists('123456789', correlationId);

    expect(actual).toBe(true);
  });

  it('then true is returned if api returns 404', async () => {
    rp.mockImplementation(() => {
      return {
        statusCode: 404,
      };
    });

    const actual = await deviceExists('123456789', correlationId);

    expect(actual).toBe(false);
  });
});
