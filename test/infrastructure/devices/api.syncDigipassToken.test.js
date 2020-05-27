jest.mock('login.dfe.request-promise-retry');
jest.mock('agentkeepalive', () => {
  return {
    HttpsAgent: jest.fn()
  }
});
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
jest.mock('login.dfe.jwt-strategies', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getBearerToken: jest.fn().mockReturnValue('token'),
    };
  });
});


const rp = require('login.dfe.request-promise-retry');

const { syncDigipassToken } = require('./../../../src/infrastructure/devices/api');

const serialNumber = '1234509876';
const code1 = '09183011';
const code2 = '18270192';

describe('when syncing a digipass token', () => {

  beforeEach(() => {
    rp.mockReturnValue({ valid: true });
  });


  it('then it should post to the digipass sync url for the serial number', async () => {
    await syncDigipassToken(serialNumber, code1, code2);

    expect(rp.mock.calls.length).toBe(1);
    expect(rp.mock.calls[0][0].method).toBe('POST');
    expect(rp.mock.calls[0][0].uri).toBe('https://device.login.dfe.test/digipass/1234509876/sync');
  });

  it('then it should authorize the request', async () => {
    await syncDigipassToken(serialNumber, code1, code2);

    expect(rp.mock.calls.length).toBe(1);
    expect(rp.mock.calls[0][0].headers.authorization).toBe('Bearer token');
  });

  it('then it should post the consecutive sync codes in the body', async () => {
    await syncDigipassToken(serialNumber, code1, code2);

    expect(rp.mock.calls.length).toBe(1);
    expect(rp.mock.calls[0][0].body).toMatchObject({
      code1,
      code2,
    });
  });

  it('then it should return valid from response', async () => {
    const actual = await syncDigipassToken(serialNumber, code1, code2);

    expect(actual).toBe(true);
  });

  it('then it should return null if there is a 400 response from the devices api', async () => {
    rp.mockImplementation(() => {
      const err = new Error('Some error');
      err.statusCode = 400;
      throw err;
    });

    const actual = await syncDigipassToken(serialNumber, code1, code2);

    expect(actual).toBeNull();
  });

  it('then it should return null if there is a 404 response from the devices api', async () => {
    rp.mockImplementation(() => {
      const err = new Error('Some error');
      err.statusCode = 404;
      throw err;
    });

    const actual = await syncDigipassToken(serialNumber, code1, code2);

    expect(actual).toBeNull();
  });

  it('then it should throw an error if there is a non-400/404 response from the devices api', async () => {
    rp.mockImplementation(() => {
      const err = new Error('Some error');
      err.statusCode = 500;
      throw err;
    });

    try {
      await syncDigipassToken(serialNumber, code1, code2);
      throw new Error('No error thrown!');
    } catch (e) {
      expect(e.message).toBe('Some error');
    }
  });
});
