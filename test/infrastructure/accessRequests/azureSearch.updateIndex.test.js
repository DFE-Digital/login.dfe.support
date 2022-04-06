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
jest.mock('uuid', () => ({v4: jest.fn().mockReturnValue('some-uuid')}));

const accessRequests = [
  {
    userId: 'user1',
    name: 'User One',
    email: 'user.one@unit.test',
    organisation: {
      id: 'org1',
      name: 'Hogwarts School of Witchcraft and Wizardry',
      address: 'my address',
      category: '001',
      uid: null,
      urn: '222222',
    },
    createdDate: new Date('2018-11-01T20:00:00.000Z')
  },
];

const rp = require('login.dfe.request-promise-retry');

describe('when updating an index with new data in azure search', () => {
  let updateIndex;

  beforeEach(() => {
    rp.mockReset();

    updateIndex = require('./../../../src/infrastructure/accessRequests/azureSearch').updateIndex;
  });


  it('then it should post to index docs access requests', async () => {
    await updateIndex(accessRequests, 'new-index-name');
    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'POST',
      uri: 'https://test-search.search.windows.net/indexes/new-index-name/docs/index?api-version=2016-09-01'
    });
  });

  it('then it should include the api key from config', async () => {
    await updateIndex(accessRequests, 'new-index-name');

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        'api-key': 'some-key',
      },
    });
  });

  it('then it should include access requests in body of request', async () => {
    await updateIndex(accessRequests, 'new-index-name');

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      body: {
        value: [
          {
            '@search.action': 'upload',
            userOrgId: 'user1org1',
            userId: 'user1',
            orgId: 'org1',
            name: 'User One',
            nameSearch: 'userone',
            email: 'user.one@unit.test',
            emailSearch: 'user.oneunit.test',
            organisationName: 'Hogwarts School of Witchcraft and Wizardry',
            orgAddress: 'my address',
            orgIdentifier: 'URN: 222222',
            createdDate: new Date('2018-11-01T20:00:00.000Z').getTime(),
          }
        ]
      },
    });
  });

  it('then if there are no users to update the endpoint is not called', async () => {
    await updateIndex([], 'new-index-name');

    expect(rp.mock.calls).toHaveLength(0);
  });
});
