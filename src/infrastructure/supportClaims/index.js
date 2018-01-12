const redis = require('redis');
const { promisify } = require('util');
const config = require('./../config');

const client = redis.createClient({
  url: config.claims.params.connectionString,
});
const getAsync = promisify(client.get).bind(client);

const getUserSupportClaims = async (id) => {
  const json = await getAsync(`SupportUser:${id}`);
  if (!json) {
    return null;
  }

  return JSON.parse(json);
};

module.exports = {
  getUserSupportClaims,
};
