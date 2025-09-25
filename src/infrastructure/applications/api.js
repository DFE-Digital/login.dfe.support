const config = require("./../config");
const logger = require("../logger");

const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");
const { getServiceToggleFlagsRaw } = require("login.dfe.api-client/services");

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

const retrieveToggleFlag = async (fliters) => {
  const emailToggleFlag = await getServiceToggleFlagsRaw(fliters);
  if (emailToggleFlag && emailToggleFlag.length === 1) {
    return emailToggleFlag[0].flag;
  }
  return true;
};

const isSupportEmailNotificationAllowed = async () => {
  return await retrieveToggleFlag({
    filters: { serviceToggleType: "email", serviceName: "support" },
  });
};

module.exports = {
  createService,
  isSupportEmailNotificationAllowed,
};
