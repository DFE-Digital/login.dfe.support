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
jest.mock('request-promise');
jest.mock('uuid/v4', () => {
  return 'some-uuid';
});


const rp = require('request-promise');

describe('when searching for a user in azure search', () => {
  let search;

  beforeEach(() => {
    rp.mockReset();
    rp.mockImplementation(() => {
      return {
        '@odata.context': 'https://sbsa-search.search.windows.net/indexes(\'users-7170516e-5671-4ea7-8e52-adfc901c73c3\')/$metadata#docs',
        '@odata.count': 49,
        'value': [
          {
            '@search.score': 0.4066307,
            'id': '34080a9c-fd79-45a6-a092-4756264d5c85',
            'name': 'User One',
            'email': 'user.one@unit.test',
            'organisationName': 'Testing school',
            'lastLogin': null,
            'statusDescription': 'Active'
          }
        ]
      };
    });

    jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
      const RedisMock = require('ioredis-mock').default;
      const redisMock = new RedisMock();
      redisMock.set('CurrentIndex_Users', 'test-index');
      return redisMock;
    }));

    search = require('./../../../src/infrastructure/users/azureSearch').search;
  });

  it('then it should search the current index for the criteria and page, with a page size of 25 and ordered by name if no order specified', async () => {
    await search('test', 1);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      uri: 'https://test-search.search.windows.net/indexes/test-index/docs?api-version=2016-09-01&search=test&$count=true&$skip=0&$top=25&$orderby=name',
    });
  });

  it('then it should search the current index for the criteria and page, with a page size of 25 and ordered by specified field if possible', async () => {
    await search('test', 1, 'email', false);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'GET',
      uri: 'https://test-search.search.windows.net/indexes/test-index/docs?api-version=2016-09-01&search=test&$count=true&$skip=0&$top=25&$orderby=email desc',
    });
  });

  it('then it should include the api key from config', async () => {
    await search('test', 1);

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        'api-key': 'some-key',
      },
    });
  });

  it('then it should map results to response', async () => {
    const actual = await search('test', 1);

    expect(actual).not.toBeNull();
    expect(actual.numberOfPages).toBe(2);
    expect(actual.users).not.toBeNull();
    expect(actual.users).toHaveLength(1);
    expect(actual.users[0]).toMatchObject({
      id: '34080a9c-fd79-45a6-a092-4756264d5c85',
      name: 'User One',
      email: 'user.one@unit.test',
      organisation: {
        name: 'Testing school',
      },
      lastLogin: null,
      status: {
        description: 'Active',
      },
    });
  });
});
