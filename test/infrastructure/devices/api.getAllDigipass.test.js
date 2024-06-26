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
const { getDevices } = require('./../../../src/infrastructure/devices/api');

const correlationId = 'abc123';
const apiResponse = [{
  serialNumber: '444-555-666',
}, {
  serialNumber: '111-333-222',
}];

describe('when getting a page of digipass tokens from the devices api', () => {
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


  it('then it should call getAllDigipass resource', async () => {
    await getDevices(correlationId);

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('http://devices.test/digipass');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'GET'
    });
  });

  it('then it should use the token from jwt strategy as bearer token', async () => {
    await getDevices(correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: 'bearer token',
      },
    });
  });

  it('then it should include the correlation id', async () => {
    await getDevices(correlationId);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        'x-correlation-id': correlationId,
      },
    });
  });
  it('then the serialNumbers are returned', async () => {
    const devices = await getDevices(correlationId);

    expect(devices.length).toBe(2);
    expect(devices[1].serialNumber).toBe('111-333-222');
  });
});
