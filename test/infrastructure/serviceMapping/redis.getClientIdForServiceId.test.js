jest.mock('redis', () => {
  return {
    createClient: jest.fn(),
  };
});
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  serviceMapping: {
    params: {
      connectionString: 'redis://localhost',
    },
  },
}));

describe('when getting a client id from a service id from redis', () => {
  let get;
  let getClientIdForServiceId;

  beforeAll(() => {
    get = jest.fn();

    const redis = require('redis');
    redis.createClient = jest.fn().mockImplementation(() => {
      return {
        get,
      };
    });

    getClientIdForServiceId = require('./../../../src/infrastructure/serviceMapping/redis').getClientIdForServiceId;
  });
  beforeEach(() => {
    get.mockReset();
    get.mockImplementation((key, callback) => {
      callback(null, JSON.stringify([
        { serviceId: 'service-1', clientId: 'client-1' },
        { serviceId: 'service-2', clientId: 'client-2' },
      ]));
    });
  });

  it('then it should return correct client id if mapping exists', async () => {
    const actual = await getClientIdForServiceId('service-1');

    expect(actual).toBe('client-1');
  });

  it('then it should return null if mapping does not exists', async () => {
    const actual = await getClientIdForServiceId('service-3');

    expect(actual).toBeNull();
  });

  it('then it should return null if no mappings exist', async () => {
    get.mockImplementation((key, callback) => {
      callback(null, null);
    });

    const actual = await getClientIdForServiceId('service-1');

    expect(actual).toBeNull();
  });
});
