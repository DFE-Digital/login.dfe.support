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

const scanPage1 = [20, ['testindex-user-key-1']];
const scanPage2 = [0, ['testindex-user-key-2']];
const user1 = JSON.stringify({
  name: 'Timmy Tester',
  email: 'timmy@tester.test',
  organisation: {
    name: 'Testco'
  },
  lastLogin: 1515670257000,
  status: {
    description: 'Active'
  },
});
const user2 = JSON.stringify({
  name: 'Brenda Breaker',
  email: 'brenda@breakage.test',
  organisation: {
    name: 'Break Inc'
  },
  lastLogin: 1515672900000,
  status: {
    description: 'Active'
  },
});

describe('when searching for users', () => {
  let get;
  let set;
  let scan;
  let search;

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

    search = require('./../../../src/infrastructure/users/redis').search;
  });

  beforeEach(() => {
    get.mockReset();
    get.mockImplementation((key, callback) => {
      if (key === 'CurrentIndex') {
        callback(null, 'testindex');
        return;
      }

      if (key === 'testindex-user-key-1') {
        callback(null, user1);
        return;
      }
      if (key === 'testindex-user-key-2') {
        callback(null, user2);
        return;
      }
      callback(null, null);
    });

    scan.mockReset();
    scan.mockImplementation((pointer, match, criteria, callback) => {
      callback(null, pointer === 0 ? scanPage1 : scanPage2);
    });
  });

  it('then it should look up the current index', async () => {
    await search('test');

    expect(get.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(get.mock.calls[0][0]).toBe('CurrentIndex');
  });

  it('then it should scan using a wildcard of the specified criteria', async () => {
    await search('TEST');

    expect(scan.mock.calls).toHaveLength(2);
    expect(scan.mock.calls[0][2]).toBe('testindex-*test*');
    expect(scan.mock.calls[1][2]).toBe('testindex-*test*');
  });

  it('then it should scan keys until no more match criteria', async () => {
    await search('test');

    expect(scan.mock.calls).toHaveLength(2);
    expect(scan.mock.calls[0][0]).toBe(0);
    expect(scan.mock.calls[1][0]).toBe(20);
  });

  it('then it should get each user returned from scan', async () => {
    await search('test');

    expect(get.mock.calls).toHaveLength(3);
    expect(get.mock.calls[1][0]).toBe('testindex-user-key-1');
    expect(get.mock.calls[2][0]).toBe('testindex-user-key-2');
  });

  it('then it should return all users from scan with last login translated to a date', async () => {
    const actual = await search('test');

    expect(actual).toHaveLength(2);
    expect(actual[0]).toMatchObject({
      name: 'Timmy Tester',
      email: 'timmy@tester.test',
      organisation: {
        name: 'Testco'
      },
      lastLogin: new Date(2018, 0, 11, 11, 30, 57),
      status: {
        description: 'Active'
      },
    });
    expect(actual[1]).toMatchObject({
      name: 'Brenda Breaker',
      email: 'brenda@breakage.test',
      organisation: {
        name: 'Break Inc'
      },
      lastLogin: new Date(2018, 0, 11, 12, 15, 0),
      status: {
        description: 'Active'
      },
    });
  });
});