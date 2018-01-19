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
  return jest.fn().mockReturnValue('some-uuid');
});


const rp = require('request-promise');

describe('when updating the active index in azure search', () => {
  let get;
  let set;
  let updateActiveIndex;

  beforeEach(() => {
    rp.mockReset();

    get = jest.fn();

    set = jest.fn().mockImplementation((key, value, callback) => {
      callback(null,null);
    });

    const redis = require('redis');
    redis.createClient = jest.fn().mockImplementation(() => {
      return {
        get,
        set,
      };
    });

    updateActiveIndex = require('./../../../src/infrastructure/users/azureSearch').updateActiveIndex;
  });

  it('then it should update CurrentIndex_Users key to index name in redis', async () => {
    await updateActiveIndex('new-index-name');

    expect(set.mock.calls).toHaveLength(1);
    expect(set.mock.calls[0][0]).toBe('CurrentIndex_Users');
    expect(set.mock.calls[0][1]).toBe('new-index-name');
  });
});
