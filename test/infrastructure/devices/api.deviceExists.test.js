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


const asyncRetry = require('login.dfe.async-retry');

const jwtStrategy = require('login.dfe.jwt-strategies');
const { deviceExists } = require('./../../../src/infrastructure/devices/api');

const correlationId = 'abc123';

describe('when getting a page of digipass tokens from the devices api', () => {
  
  const mockedFetch = jest.fn().mockResolvedValue({
    text: async () => 'Test response',
  });

  beforeEach(() => {
    
    global.fetch = mockedFetch;

    asyncRetry.mockReset();
    
    asyncRetry.mockImplementation(() => {
      return {
        status: 204,
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

    expect(asyncRetry.mock.calls).toHaveLength(1);
    
    await asyncRetry.mock.calls[0][0]();

    expect(mockedFetch.mock.calls[0][0]).toBe('http://devices.test/digipass/123456789')
    expect(mockedFetch.mock.calls[0][1]).toMatchObject({
      method: 'GET',
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await deviceExists('123456789', correlationId);

    await asyncRetry.mock.calls[0][0]();

    expect(mockedFetch.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await deviceExists('123456789', correlationId);

    await asyncRetry.mock.calls[0][0]();

    expect(mockedFetch.mock.calls[0][1]).toMatchObject({
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
    asyncRetry.mockImplementation(() => {
      return {
        status: 404,
      };
    });

    const actual = await deviceExists('123456789', correlationId);

    expect(actual).toBe(false);
  });
});
