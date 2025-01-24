const Redis = require("ioredis");
const config = require("./../config");

const client = new Redis(config.claims.params.connectionString);

const getUserSupportClaims = async (id) => {
  const json = await client.get(`SupportUser:${id}`);
  if (!json) {
    return null;
  }

  return JSON.parse(json);
};

module.exports = {
  getUserSupportClaims,
};
