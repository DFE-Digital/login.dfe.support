const redis = require('redis');
const { promisify } = require('util');
const config = require('./../config');
const { concat } = require('lodash');

const client = redis.createClient({
  url: config.cache.params.connectionString,
});
const getAsync = promisify(client.get).bind(client);
const scanAsync = promisify(client.scan).bind(client);

const getPage = async (criteria, pointer) => {
  const result = await scanAsync(pointer, 'MATCH', `*${criteria.toLowerCase()}*`);

  const nextPagePointer = result[0];
  const users = await Promise.all(result[1].map(async (key) => {
    const user = JSON.parse(await getAsync(key));
    user.lastLogin = new Date(user.lastLogin);
    return user;
  }));

  return {
    nextPagePointer,
    users,
  };
};

const search = async (criteria) => {
  let results = [];

  let nextPagePointer = 0;
  do {
    const page = await getPage(criteria, nextPagePointer);
    results = concat(results, page.users);
    nextPagePointer = page.nextPagePointer;
  } while (nextPagePointer > 0);

  return results;
};

module.exports = {
  search,
};
