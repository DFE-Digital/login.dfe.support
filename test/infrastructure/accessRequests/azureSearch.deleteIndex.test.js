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
  return jest.fn().mockReturnValue('some-uuid');
});

const accessRequestId ='userOrg1';

const rp = jest.fn();
const requestPromise = require('request-promise');
requestPromise.defaults.mockReturnValue(rp);


describe('when deleting an item from the index with azure search', () => {
  let deleteIndex;

  beforeEach(() => {
    rp.mockReset();
    jest.doMock('ioredis', () => jest.fn().mockImplementation(() => {
      const RedisMock = require('ioredis-mock').default;
      const redisMock = new RedisMock();
      redisMock.set('CurrentIndex_AccessRequests', 'new-index-name');
      return redisMock;
    }));
    deleteIndex = require('./../../../src/infrastructure/accessRequests/azureSearch').deleteAccessRequest;
  });

  it('then it should delete the index docs from access requests', async () => {
    await deleteIndex(accessRequestId, 'new-index-name');
    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'DELETE',
      uri: 'https://test-search.search.windows.net/indexes/new-index-name/docs/index?api-version=2016-09-01'
    });
  });

  it('then it should include the api key from config', async () => {
    await deleteIndex(accessRequestId, 'new-index-name');

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        'api-key': 'some-key',
      },
    });
  });

  it('then it should include access requests in body of request', async () => {
    await deleteIndex(accessRequestId, 'new-index-name');

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      body: {
        value:
          {
            '@search.action': 'delete',
            userOrgId: 'userOrg1'
          }
      },
    });
  });
});
