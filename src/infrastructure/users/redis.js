const redis = require('redis');
const { promisify } = require('util');
const config = require('./../config');
const { concat, chunk } = require('lodash');
const uuid = require('uuid/v4');
const logger = require('./../logger');

const tls = config.cache.params.connectionString.includes('6380');
const client = redis.createClient({
  url: config.cache.params.connectionString,
  tls,
});
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const scanAsync = promisify(client.scan).bind(client);
const delAsync = promisify(client.del).bind(client);

const getSorter = (sortBy, sortAsc) => {
  const valueExtractor = (obj) => {
    switch (sortBy) {
      case 'email':
        return obj.email;
      case 'organisation':
        return obj.organisation.name;
      case 'lastlogin':
        return obj.lastLogin;
      default:
        return obj.name;
    }
  };

  return (x, y) => {
    const valueX = valueExtractor(x);
    const valueY = valueExtractor(y);

    if (valueX < valueY) {
      return sortAsc ? -1 : 1;
    }
    if (valueX > valueY) {
      return sortAsc ? 1 : -1;
    }
    return 0;
  };
};

const getPage = async (criteria, pointer, indexName) => {
  const result = await scanAsync(pointer, 'MATCH', `${indexName}-*${criteria.toLowerCase()}*`);

  const nextPagePointer = result[0];
  const users = await Promise.all(result[1].map(async (key) => {
    const user = JSON.parse(await getAsync(key));
    user.lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
    return user;
  }));

  return {
    nextPagePointer,
    users,
  };
};

const deleteUsersInIndex = async (indexName) => {
  const userKeysToDelete = [];
  let pointer = 0;
  do {
    const result = await scanAsync(pointer, 'MATCH', `${indexName}-*`);
    pointer = result[0];
    result[1].forEach((key) => {
      userKeysToDelete.push(key);
    });
  } while (pointer > 0);

  for (let i = 0; i < userKeysToDelete.length; i++) {
    const key = userKeysToDelete[i];
    await delAsync(key);
    logger.info(`Deleted user key ${key} while deleting index ${indexName}`);
  }
};


const search = async (criteria, pageNumber, sortBy = 'name', sortAsc = true) => {
  const indexName = await getAsync('CurrentIndex');
  if (!indexName) {
    return [];
  }

  let results = [];
  let nextPagePointer = 0;
  do {
    const page = await getPage(criteria, nextPagePointer, indexName);
    results = concat(results, page.users);
    nextPagePointer = page.nextPagePointer;
  } while (nextPagePointer > 0);

  const pages = chunk(results, 25);
  let users = [];
  if (pageNumber <= pages.length) {
    users = pages[pageNumber - 1].sort(getSorter(sortBy, sortAsc));
  }

  return {
    users,
    numberOfPages: pages.length,
  };
};

const getById = async (userId) => {
  const indexName = await getAsync('CurrentIndex');
  if (!indexName) {
    return null;
  }

  let pointer = 0;
  do {
    const result = await scanAsync(pointer, 'MATCH', `${indexName}-*`);

    pointer = result[0];
    const user = result[1].find(x => x.id === userId);
    if (user) {
      return user;
    }
  } while (pointer > 0);
  return null;
};

const createIndex = async () => {
  return Promise.resolve(uuid());
};

const updateIndex = async (users, index) => {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const key = `${index}-${user.name}:${user.email}:${user.organisation ? user.organisation.name : ''}`;
    await setAsync(key, JSON.stringify(user));
  }
};

const updateActiveIndex = async (index) => {
  await setAsync('CurrentIndex', index);
};

const deleteUnusedIndexes = async () => {
  const currentIndex = await getAsync('CurrentIndex');

  // Delete any indexes already marked as unused
  const unusedJson = await getAsync('UnusedIndexes');
  const unusedIndexes = unusedJson ? JSON.parse(unusedJson) : [];
  for (let i = 0; i < unusedIndexes.length; i++) {
    if (unusedIndexes[i] !== currentIndex) {
      await deleteUsersInIndex(unusedIndexes[i]);
      logger.info(`Deleted index ${unusedIndexes[i]}`);
    }
  }

  // Find any remaining indexes that appear to be unused
  const indexesAppearingUnused = [];
  let pointer = 0;
  do {
    const result = await scanAsync(pointer);
    pointer = result[0];
    result[1].forEach((key) => {
      if (key.length > 37) {
        const indexName = key.substr(0, 36);
        if (indexName != currentIndex && !indexesAppearingUnused.find(x => x === indexName)) {
          indexesAppearingUnused.push(indexName);
        }
      }
    });
  } while (pointer > 0);
  await setAsync('UnusedIndexes', JSON.stringify(indexesAppearingUnused));
};

module.exports = {
  search,
  getById,
  createIndex,
  updateIndex,
  updateActiveIndex,
  deleteUnusedIndexes,
};
