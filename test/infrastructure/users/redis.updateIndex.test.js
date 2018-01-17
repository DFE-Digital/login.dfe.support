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

const users = [
  { name: 'User One', email: 'user.one@unit.test', organisation: { name: 'Org A' } },
  { name: 'User Two', email: 'user.two@unit.test', organisation: { name: 'Org B' } },
];
const indexName = 'testindex';

describe('when creating a new index', () => {
  let get;
  let set;
  let scan;
  let updateIndex;

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

    updateIndex = require('./../../../src/infrastructure/users/redis').updateIndex;
  });
  beforeEach(() => {
    get.mockReset();

    set.mockReset();
    set.mockImplementation((key, value, callback) => {
      callback(null, null);
    });
    scan.mockReset();
  });

  it('then it should set each user in redis', async () => {
    await updateIndex(users, indexName);

    expect(set.mock.calls).toHaveLength(2);
  });

  it('then it should use key [index]-[name]:[email]:[orgName]', async () => {
    await updateIndex(users, indexName);

    expect(set.mock.calls[0][0]).toBe('testindex-User One:user.one@unit.test:Org A');
    expect(set.mock.calls[1][0]).toBe('testindex-User Two:user.two@unit.test:Org B');
  });

  it('then it should use JSON representation of user as value', async () => {
    await updateIndex(users, indexName);

    expect(set.mock.calls[0][1]).toBe(JSON.stringify(users[0]));
    expect(set.mock.calls[1][1]).toBe(JSON.stringify(users[1]));
  });
});