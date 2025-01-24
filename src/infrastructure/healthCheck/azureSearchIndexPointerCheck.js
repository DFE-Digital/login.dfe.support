const healthCheck = require("login.dfe.healthcheck");

const azureSearchIndexPointerCheck = async (key, value, path) => {
  if (key === "cache" && value.params.indexPointerConnectionString) {
    const status = await healthCheck.checks.redisCheck.getConnectionStatus(
      value.params.indexPointerConnectionString,
    );
    return {
      key,
      path,
      status,
    };
  }
};

module.exports = azureSearchIndexPointerCheck;
