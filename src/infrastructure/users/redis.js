const redis = require('redis');
const { promisify } = require('util');
const config = require('./../config');
const { concat, chunk } = require('lodash');
const uuid = require('uuid/v4');

const client = redis.createClient({
  url: config.cache.params.connectionString,
});
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const scanAsync = promisify(client.scan).bind(client);

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

module.exports = {
  search,
  createIndex,
  updateIndex,
  updateActiveIndex,
};
