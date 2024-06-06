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
jest.mock('login.dfe.async-retry');
jest.mock('uuid', () => ({v4: jest.fn().mockReturnValue('some-uuid')}));


const {fetchApi} = require('login.dfe.async-retry');

describe('when creating an index in azure search', () => {
  let createIndex;

  beforeEach(() => {
    fetchApi.mockReset();

    createIndex = require('./../../../src/infrastructure/userDevices/azureSearch').createIndex;
  });


  it('then it should put new index using new index name in uri', async () => {
    await createIndex();

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][0]).toBe('https://test-search.search.windows.net/indexes/userdevices-some-uuid?api-version=2016-09-01');
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      method: 'PUT'
    })
  });

  it('then it should include api-key from config', async () => {
    await createIndex();

    expect(fetchApi.mock.calls).toHaveLength(1);
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        'api-key': 'some-key',
      },
    });
  });

  it('then it should include index schema in body', async () => {
    await createIndex();

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      body: {
        name: 'userdevices-some-uuid',
        fields: [
          { name: 'id', type: 'Edm.String', key: true, searchable: false },
          { name: 'deviceId', type: 'Edm.String', searchable: false },
          { name: 'deviceStatus', type: 'Edm.String', searchable: false, filterable: true },
          { name: 'serialNumber', type: 'Edm.String',sortable:true, searchable: true },
          { name: 'name', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
          { name: 'nameSearch', type: 'Edm.String',  searchable: true },
          { name: 'email', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
          { name: 'emailSearch', type: 'Edm.String',  searchable: true },
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
