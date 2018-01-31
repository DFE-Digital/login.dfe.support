const healthCheck = require('login.dfe.healthcheck');
const azureSearchIndexPointerCheck = require('./azureSearchIndexPointerCheck');

const getHealthCheckChecks = () => {
  return healthCheck.checks.defaultChecks.concat([
    azureSearchIndexPointerCheck,
  ]);
};

module.exports = {
  getHealthCheckChecks,
};
