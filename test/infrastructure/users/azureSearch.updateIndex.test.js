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

const users = [
  {
    id: 'user1',
    name: 'User One',
    email: 'user.one@unit.test',
    organisation: {
      name: 'Hogwarts School of Witchcraft and Wizardry',
    },
    lastLogin: null,
    status: {
      description: 'Active',
    },
  },
];

const rp = jest.fn();
const requestPromise = require('request-promise');
requestPromise.defaults.mockReturnValue(rp);

describe('when updating an index with new data in azure search', () => {
  let updateIndex;

  beforeEach(() => {
    rp.mockReset();

    updateIndex = require('./../../../src/infrastructure/users/azureSearch').updateIndex;
  });

  it('then it should post to index docs user', async () => {
    await updateIndex(users, 'new-index-name');

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      method: 'POST',
      uri: 'https://test-search.search.windows.net/indexes/new-index-name/docs/index?api-version=2016-09-01'
    });
  });

  it('then it should include the api key from config', async () => {
    await updateIndex(users, 'new-index-name');

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      headers: {
        'api-key': 'some-key',
      },
    });
  });

  it('then it should include users in body of request', async () => {
    await updateIndex(users, 'new-index-name');

    expect(rp.mock.calls).toHaveLength(1);
    expect(rp.mock.calls[0][0]).toMatchObject({
      body: {
        value: [
          {
            '@search.action': 'upload',
            id: 'user1',
            name: 'User One',
            nameSearch: 'userone',
            email: 'user.one@unit.test',
            emailSearch: 'user.one%40unit.test',
            organisationName: 'Hogwarts School of Witchcraft and Wizardry',
            lastLogin: null,
            statusDescription: 'Active',
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
