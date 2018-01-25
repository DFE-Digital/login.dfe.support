const redis = require('redis');
const { promisify } = require('util');
const config = require('./../config');

const client = redis.createClient({
  url: config.serviceMapping.params.connectionString,
});
const getAsync = promisify(client.get).bind(client);

const getAll = async () => {
  const json = await getAsync('SupportServiceMapping');
  if (!json) {
    return [];
  }

  return JSON.parse(json);
};

const getClientIdForServiceId = async (serviceId) => {
  const mapping = await getAll();
  const serviceMap = mapping.find(x => x.serviceId === serviceId);
  return serviceMap;
};

module.exports = {
  getClientIdForServiceId,
};
