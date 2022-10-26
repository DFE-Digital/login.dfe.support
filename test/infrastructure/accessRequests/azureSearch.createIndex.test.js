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
jest.mock('login.dfe.request-promise-retry');
jest.mock('uuid', () => {
  return {v4: jest.fn().mockReturnValue('some-uuid')};
});


const rp  = require('login.dfe.request-promise-retry');

describe('when creating an index in azure search', () => {
  let createIndex;

  beforeEach(() => {
    rp.mockReset();

    createIndex = require('./../../../src/infrastructure/accessRequests/azureSearch').createIndex;
  });

  it('then it should put new index using new index name in uri', async () => {
    await createIndex();

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'PUT',
      uri: 'https://test-search.search.windows.net/indexes/accessrequests-some-uuid?api-version=2016-09-01'
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
        name: 'accessrequests-some-uuid',
        fields: [
          { name: 'userOrgId', type: 'Edm.String', key: true, searchable: false },
          { name: 'userId', type: 'Edm.String',  searchable: false },
          { name: 'orgId', type: 'Edm.String', searchable: false },
          { name: 'name', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
          { name: 'nameSearch', type: 'Edm.String',  searchable: true },
          { name: 'email', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
          { name: 'emailSearch', type: 'Edm.String',  searchable: true },
          { name: 'createdDate',  type: 'Edm.Int64', sortable: true, filterable: true },
          { name: 'organisationName', type: 'Edm.String', sortable: true, filterable: true, searchable: true },
          { name: 'orgAddress', type: 'Edm.String'},
          { name: 'orgIdentifier', type: 'Edm.String'},
        ]
      }
    });
  });

  it('then it should return the new index name', async () => {
    const actual = await createIndex();

    expect(actual).toBe('accessrequests-some-uuid');
  });
});
