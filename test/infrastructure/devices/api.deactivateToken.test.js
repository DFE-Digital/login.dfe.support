jest.mock('login.dfe.request-promise-retry');
jest.mock('./../../../src/infrastructure/config', () => {
  return {
    devices: {
      service: {
        url: 'https://device.login.dfe.test',
      },
    },
    hostingEnvironment: {
      agentKeepAlive: {}
    },
  };
});
jest.mock('agentkeepalive', () => {
  return {
    HttpsAgent: jest.fn()
  }
});
jest.mock('login.dfe.jwt-strategies', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getBearerToken: jest.fn().mockReturnValue('token'),
    };
  });
});

const rp = require('login.dfe.request-promise-retry');


const { deactivateToken } = require('./../../../src/infrastructure/devices/api');

const serialNumber = '1234509876';
const reason = 'Token lost';

describe('when deactivating a digipass token', () => {

  beforeEach(() => {
    rp.mockReturnValue({ valid: true });
  });


  it('then it should put to the digipass deactivate url for the serial number', async () => {
    await deactivateToken(serialNumber);

    expect(rp.mock.calls.length).toBe(1);
    expect(rp.mock.calls[0][0].method).toBe('PUT');
    expect(rp.mock.calls[0][0].uri).toBe('https://device.login.dfe.test/digipass/1234509876/deactivate');
  });

  it('then it should authorize the request', async () => {
    await deactivateToken(serialNumber);

    expect(rp.mock.calls.length).toBe(1);
    expect(rp.mock.calls[0][0].headers.authorization).toBe('Bearer token');
  });

  it('then it should post the reason in the body', async () => {
    await deactivateToken(serialNumber, reason);

    expect(rp.mock.calls.length).toBe(1);
    expect(rp.mock.calls[0][0].body).toMatchObject({
      reason,
    });
  });

  it('then it should return valid from response', async () => {
    const actual = await deactivateToken(serialNumber);

    expect(actual).toBe(true);
  });

  it('then it should return false if there is a 404 response from the devices api', async () => {
    rp.mockImplementation(() => {
      const err = new Error('Some error');
      err.statusCode = 404;
      throw err;
    });

    const actual = await deactivateToken(serialNumber);

    expect(actual).toBe(false);
  });

  it('then it should throw an error if there is a non-400/404 response from the devices api', async () => {
    rp.mockImplementation(() => {
      const err = new Error('Some error');
      err.statusCode = 500;
      throw err;
    });

    try {
      await deactivateToken(serialNumber);
      throw new Error('No error thrown!');
    } catch (e) {
      expect(e.message).toBe('Some error');
    }
  });
});
