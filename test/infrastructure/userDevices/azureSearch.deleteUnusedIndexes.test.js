jest.mock('ioredis', () => jest.fn().mockImplementation(() => {
}));
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  cache: {
    params: {
      indexPointerConnectionString: 'redis://localhost',
      serviceName: 'test-search',
      apiKey: 'some-key',
    },
  },
}));
jest.mock('login.dfe.request-promise-retry');
jest.mock('uuid/v4', () => {
  return 'some-uuid';
});

const rp = require('login.dfe.request-promise-retry');

describe('When deleting unused indexes from Azure Search', () => {
  let deleteUnusedIndexes;

  beforeEach(() => {
    // jest.resetModules();
    jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
      const RedisMock = require('ioredis-mock').default;
      const redisMock = new RedisMock();
      redisMock.set('CurrentIndex_UserDevices', 'userDevices-58457890-ba74-49ae-86eb-b4a144649805');
      redisMock.set('UnusedIndexes_UserDevices', '["userDevices-4771d85e-f3ef-4e71-82ca-30f0663b10c9"]');
      return redisMock;
    }));

    rp.mockReset();
    rp.mockImplementation((opts) => {
      if (opts.method === 'GET') {
        return {
          "@odata.context": "https://test-search.search.windows.net/$metadata#indexes",
          "value": [
            {
              "@odata.etag": "\"0x8D561869625D56C\"",
              "name": "userDevices-58457890-ba74-49ae-86eb-b4a144649805",
              /*other properties omitted*/
            },
            {
              "@odata.etag": "\"0x8D561869625D56C\"",
              "name": "userDevices-4771d85e-f3ef-4e71-82ca-30f0663b10c9",
              /*other properties omitted*/
            },
            {
              "@odata.etag": "\"0x8D561869625D56C\"",
              "name": "users-24b1f0da-7f82-48b0-9106-720135f9b051",
              /*other properties omitted*/
            }
          ]
        }
      }
    });
    deleteUnusedIndexes = require('./../../../src/infrastructure/userDevices/azureSearch').deleteUnusedIndexes;
  });


  it('then it should delete user devices in indexes marked as unused that are still not used', async () => {
    await deleteUnusedIndexes();

    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'DELETE',
      uri: 'https://test-search.search.windows.net/indexes/userDevices-4771d85e-f3ef-4e71-82ca-30f0663b10c9?api-version=2016-09-01',
    });
  });

  it('then it should not delete users in indexes marked as unused that are now used', async () => {
    await deleteUnusedIndexes();

    rp.mock.calls.forEach((call) => {
      expect(call[0].uri).not.toMatch(/indexes\/userDevices-58457890-ba74-49ae-86eb-b4a144649805/);
    });
  });

  it('then it should mark any indexes that are not current as unused', async () => {
    const ioRedis = require('ioredis');

    await deleteUnusedIndexes();

    const mockRedis = ioRedis();
    const actual = await mockRedis.get('UnusedIndexes_UserDevices');
    expect(actual).toBe(JSON.stringify([
      'userDevices-4771d85e-f3ef-4e71-82ca-30f0663b10c9',
    ]));
  });
});
