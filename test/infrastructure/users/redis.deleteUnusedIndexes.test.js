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

const redisData = [
  { key: 'CurrentIndex', value: '58457890-ba74-49ae-86eb-b4a144649805' },
  {
    key: 'UnusedIndexes',
    value: JSON.stringify(['58457890-ba74-49ae-86eb-b4a144649805', '4771d85e-f3ef-4e71-82ca-30f0663b10c9'])
  },

  { key: '58457890-ba74-49ae-86eb-b4a144649805-user.one@unit.test', value: '{}' },
  { key: '58457890-ba74-49ae-86eb-b4a144649805-user.two@unit.test', value: '{}' },
  { key: '4771d85e-f3ef-4e71-82ca-30f0663b10c9-user.one@unit.test', value: '{}' },
  { key: '4771d85e-f3ef-4e71-82ca-30f0663b10c9-user.two@unit.test', value: '{}' },
  { key: 'ad21261b-ab85-4271-a6fd-c094fb7d5c29-user.one@unit.test', value: '{}' },
  { key: 'ad21261b-ab85-4271-a6fd-c094fb7d5c29-user.two@unit.test', value: '{}' },
  { key: 'ad21261b-ab85-4271-a6fd-c094fb7d5c29-user.three@unit.test', value: '{}' },
];

describe('when searching for users in redis', () => {
  let get;
  let set;
  let scan;
  let del;
  let deleteUnusedIndexes;

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

    deleteUnusedIndexes = require('./../../../src/infrastructure/users/redis').deleteUnusedIndexes;
  });

  beforeEach(() => {
    get.mockReset();
    get.mockImplementation((key, callback) => {
      const data = redisData.find(x => x.key === key);

      callback(null, data ? data.value : null);
    });

    set.mockReset();
    set.mockImplementation((key, value, callback) => {
      callback(null, null);
    });

    scan.mockReset();
    scan.mockImplementation((pointer, match, criteria, callback) => {
      let results;

      if (criteria) {
        results = redisData.filter(x => x.key.match(criteria.replace('*', '.*')));
      } else {
        results = redisData;
      }

      const cb = callback ? callback : match;
      cb(null, [
        0,
        results.map(x => x.key),
      ]);
    });

    del.mockReset();
    del.mockImplementation((key, callback) => {
      callback(null, null);
    });
  });

  it('then it should delete users in indexes marked as unused that are still not used', async () => {
    await deleteUnusedIndexes();

    expect(del.mock.calls).toHaveLength(2);
    expect(del.mock.calls[0][0]).toBe('4771d85e-f3ef-4e71-82ca-30f0663b10c9-user.one@unit.test');
    expect(del.mock.calls[1][0]).toBe('4771d85e-f3ef-4e71-82ca-30f0663b10c9-user.two@unit.test');
  });

  it('then it should not delete users in indexes marked as unused that are now used', async () => {
    await deleteUnusedIndexes();

    del.mock.calls.forEach((call) => {
      expect(call[0]).not.toMatch(/Current-.*/);
    });
  });

  it('then it should mark any indexes that are not current as unused', async () => {
    await deleteUnusedIndexes();

    expect(set.mock.calls).toHaveLength(1);
    expect(set.mock.calls[0][0]).toBe('UnusedIndexes');
    expect(set.mock.calls[0][1]).toBe(JSON.stringify([
      '4771d85e-f3ef-4e71-82ca-30f0663b10c9',
      'ad21261b-ab85-4271-a6fd-c094fb7d5c29',
    ]));
  })
});