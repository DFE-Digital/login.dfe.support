const Redis = require("ioredis");
const config = require("./../config");

const client = new Redis(config.serviceMapping.params.connectionString);

const getAll = async () => {
  const json = await client.get("SupportServiceMapping");
  if (!json) {
    return [];
  }

  return JSON.parse(json);
};

const getClientIdForServiceId = async (serviceId) => {
  const mapping = await getAll();
  const serviceMap = mapping.find((x) => x.serviceId === serviceId);
  return serviceMap ? serviceMap.clientId : null;
};

const getServiceIdForClientId = async (clientId) => {
  const mapping = await getAll();
  const serviceMap = mapping.find((x) => x.clientId === clientId);
  return serviceMap ? serviceMap.serviceId : null;
};

module.exports = {
  getClientIdForServiceId,
  getServiceIdForClientId,
};
