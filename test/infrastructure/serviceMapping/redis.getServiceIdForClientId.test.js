jest.mock('ioredis', () => jest.fn().mockImplementation(() => {
}));
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  serviceMapping: {
    params: {
      connectionString: 'redis://localhost',
    },
  },
}));

describe('when getting a service id from a client id from redis', () => {
  let getServiceIdForClientId;

  beforeEach(() => {
    jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
      const RedisMock = require('ioredis-mock').default;
      const redisMock = new RedisMock();
      redisMock.set('SupportServiceMapping', JSON.stringify([
        { serviceId: 'service-1', clientId: 'client-1' },
        { serviceId: 'service-2', clientId: 'client-2' },
      ]));
      return redisMock;
    }));
    getServiceIdForClientId = require('./../../../src/infrastructure/serviceMapping/redis').getServiceIdForClientId;
  });

  it('then it should return correct client id if mapping exists', async () => {
    const actual = await getServiceIdForClientId('client-1');

    expect(actual).toBe('service-1');
  });

  it('then it should return null if mapping does not exists', async () => {
    const actual = await getServiceIdForClientId('client-3');

    expect(actual).toBeNull();
  });

  it('then it should return null if no mappings exist', async () => {
    jest.resetModules();
    jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
      const RedisMock = require('ioredis-mock').default;
      const redisMock = new RedisMock();
      return redisMock;
    }));
    getServiceIdForClientId = require('./../../../src/infrastructure/serviceMapping/redis').getServiceIdForClientId;

    const actual = await getServiceIdForClientId('client-1');

    expect(actual).toBeNull();
  });
});
