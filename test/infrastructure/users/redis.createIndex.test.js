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
  let del;
  let createIndex;

  beforeAll(() => {
    get = jest.fn();

    set = jest.fn();

    scan = jest.fn();

    del = jest.fn();

    const redis = require('redis');
    redis.createClient = jest.fn().mockImplementation(() => {
      return {
        get,
        set,
        scan,
        del,
      };
    });

    createIndex = require('./../../../src/infrastructure/users/redis').createIndex;
  });
  beforeEach(() => {
    get.mockReset();
    set.mockReset();
    scan.mockReset();
  });

  it('then it should return a new uuid', async () => {
    const actual = await createIndex();

    expect(actual).toMatch(/^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/);
  });

  it('then it should not modify redis', async () => {
    await createIndex();

    expect(get.mock.calls).toHaveLength(0);
    expect(set.mock.calls).toHaveLength(0);
    expect(scan.mock.calls).toHaveLength(0);
  });
});