jest.mock('login.dfe.async-retry');
jest.mock('login.dfe.jwt-strategies');
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  devices: {
    type: 'api',
    service: {
      url: 'http://devices.test',
    },
  },
}));

const {fetchApi} = require('login.dfe.async-retry');

const jwtStrategy = require('login.dfe.jwt-strategies');
const { getDeviceUnlockCode } = require('./../../../src/infrastructure/devices/api');

const correlationId = 'abc123';

describe('when getting an unlock code from the devices api', () => {
  beforeEach(() => {
    fetchApi.mockReset();
    fetchApi.mockImplementation(() => {
      return {
        unlock1: '1234567',
        unlock2: '7654321',
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
    await getDeviceUnlockCode('123456789','unlock1', correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('http://devices.test/digipass/123456789?fields=unlock1');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'GET'
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await getDeviceUnlockCode('123456789','unlock1', correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await getDeviceUnlockCode('123456789','unlock1', correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });

  it('then the unlock code 1 is returned in the resposne', async () => {
    const actual = await getDeviceUnlockCode('123456789','unlock1', correlationId);

    expect(actual).toBe('1234567');
  });

  it('then the unlock code 2 is returned in the resposne', async () => {
    const actual = await getDeviceUnlockCode('123456789','unlock2', correlationId);

    expect(actual).toBe('7654321');
  });

  it('then if an invalid unlock code is filtered undefined is returned', async () => {
    const actual = await getDeviceUnlockCode('123456789','unlock3', correlationId);

    expect(actual).toBe(undefined);
  });
});
