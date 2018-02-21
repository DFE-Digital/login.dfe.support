jest.mock('ioredis', () => jest.fn().mockImplementation(() => {
  const RedisMock = require('ioredis-mock').default;
  const redisMock = new RedisMock();
  return redisMock;
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
jest.mock('request-promise');
jest.mock('uuid/v4', () => {
  return jest.fn().mockReturnValue('some-uuid');
});


const rp = require('request-promise');

describe('when creating an index in azure search', () => {
  let get;
  let set;
  let createIndex;

  beforeEach(() => {
    rp.mockReset();

    get = jest.fn();

    set = jest.fn();

    const redis = require('redis');
    redis.createClient = jest.fn().mockImplementation(() => {
      return {
        get,
        set,
      };
    });

    createIndex = require('./../../../src/infrastructure/userDevices/azureSearch').createIndex;
  });

  it('then it should put new index using new index name in uri', async () => {
    await createIndex();

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'PUT',
      uri: 'https://test-search.search.windows.net/indexes/userdevices-some-uuid?api-version=2016-09-01'
    })
  });

  it('then it should include api-key from config', async () => {
    await createIndex();

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        'api-key': 'some-key',
      },
    });
  });

  it('then it should include index schema in body', async () => {
    await createIndex();

    expect(rp.mock.calls[0][0]).toMatchObject({
      body: {
        name: 'userdevices-some-uuid',
        fields: [
          { name: 'id', type: 'Edm.String', key: true, searchable: false },
          { name: 'deviceId', type: 'Edm.String', searchable: false },
          { name: 'deviceStatus', type: 'Edm.String', searchable: false, filterable: true },
          { name: 'serialNumber', type: 'Edm.String',sortable:true, searchable: true },
          { name: 'name', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
          { name: 'email', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
          { name: 'organisationName', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
          { name: 'lastLogin', type: 'Edm.Int64', sortable: true, filterable: true },
        ]
      }
    });
  });

  it('then it should return the new index name', async () => {
    const actual = await createIndex();

    expect(actual).toBe('userdevices-some-uuid');
  });
});
