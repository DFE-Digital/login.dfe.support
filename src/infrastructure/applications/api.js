const config = require("./../config");
const logger = require("../logger");

const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");

const createService = async (body, correlationId) => {
  if (!body) {
    return undefined;
  }
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const client = await fetchApi(
      `${config.applications.service.url}/services`,
      {
        method: "POST",
        headers: {
          authorization: `bearer ${token}`,
          "x-correlation-id": correlationId,
        },
        body,
      },
    );
    return client;
  } catch (e) {
    if (e.statusCode === 400) {
      logger.error(
        `A 400 error occurred when creating a new service, ${e.error.reasons}`,
        {
          correlationId,
        },
      );
    } else {
      logger.error(`An error occurred when creating a new service, ${e}`, {
        correlationId,
      });
    }
    throw e;
  }
};

module.exports = {
  createService,
};
