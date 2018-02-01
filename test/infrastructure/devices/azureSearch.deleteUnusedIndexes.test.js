jest.mock('redis', () => {
  return {
    createClient: jest.fn(),
  };
});
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  cache: {
    params: {
      indexPointerConnectionString: 'redis://localhost',
      serviceName: 'test-search',
      apiKey: 'some-key',
    },
  },
}));
jest.mock('request-promise');
jest.mock('uuid/v4', () => {
  return 'some-uuid';
});


const rp = require('request-promise');

describe('When deleting unused indexes from Azure Search', () => {
  let get;
  let set;
  let deleteUnusedIndexes;

  beforeAll(() => {
    get = jest.fn();

    set = jest.fn();

    const redis = require('redis');
    redis.createClient = jest.fn().mockImplementation(() => {
      return {
        get,
        set,
      };
    });

    deleteUnusedIndexes = require('./../../../src/infrastructure/userDevices/azureSearch').deleteUnusedIndexes;
  });
  beforeEach(() => {
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

    get.mockReset();
    get.mockImplementation((key, callback) => {
      if (key === 'CurrentIndex_UserDevices') {
        callback(null, 'userDevices-58457890-ba74-49ae-86eb-b4a144649805');
      } else if (key === 'UnusedIndexes_UserDevices') {
        callback(null, '["userDevices-4771d85e-f3ef-4e71-82ca-30f0663b10c9"]');
      }
    });

    set.mockReset();
    set.mockImplementation((key, value, callback) => {
      callback(null, null);
    });
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
    await deleteUnusedIndexes();

    expect(set.mock.calls).toHaveLength(1);
    expect(set.mock.calls[0][0]).toBe('UnusedIndexes_UserDevices');
    expect(set.mock.calls[0][1]).toBe(JSON.stringify([
      'userDevices-4771d85e-f3ef-4e71-82ca-30f0663b10c9',
    ]));
  });
});
