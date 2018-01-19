jest.mock('redis', () => {
  return {
    createClient: jest.fn(),
  };
});
jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory({
  cache: {
    params: {
      connectionString: 'redis://localhost',
    },
  },
}));

describe('when creating a new index', () => {
  let get;
  let set;
  let scan;
  let updateActiveIndex;

  beforeAll(() => {
    get = jest.fn();

    set = jest.fn();

    scan = jest.fn();

    const redis = require('redis');
    redis.createClient = jest.fn().mockImplementation(() => {
      return {
        get,
        set,
        scan,
      };
    });

    updateActiveIndex = require('./../../../src/infrastructure/users/redis').updateActiveIndex;
  });
  beforeEach(() => {
    get.mockReset();

    set.mockReset();
    set.mockImplementation((key, value, callback) => {
      callback(null, null);
    });

    scan.mockReset();
  });

  it('then it should update CurrentIndex key with index name', async () => {
    await updateActiveIndex('testindex');

    expect(set.mock.calls).toHaveLength(1);
    expect(set.mock.calls[0][0]).toBe('CurrentIndex');
    expect(set.mock.calls[0][1]).toBe('testindex');
  });
});