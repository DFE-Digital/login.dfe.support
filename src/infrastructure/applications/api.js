const config = require("./../config");
const logger = require("../logger");

const { fetchApi } = require("login.dfe.async-retry");
const jwtStrategy = require("login.dfe.jwt-strategies");

const supportTogglePath = "/constants/toggleflags/email/support";

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

const getServiceById = async (id) => {
  if (!id) {
    return undefined;
  }
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const client = await fetchApi(
      `${config.applications.service.url}/services/${id}`,
      {
        method: "GET",
        headers: {
          authorization: `bearer ${token}`,
        },
      },
    );
    return client;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const getPageOfService = async (pageNumber, pageSize) => {
  const token = await jwtStrategy(config.applications.service).getBearerToken();

  try {
    const client = await fetchApi(
      `${config.applications.service.url}/services?page=${pageNumber}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers: {
          authorization: `bearer ${token}`,
        },
      },
    );
    return client;
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const getAllServices = async () => {
  const services = [];

  let pageNumber = 1;
  let numberOfPages = undefined;
  while (numberOfPages === undefined || pageNumber <= numberOfPages) {
    const page = await getPageOfService(pageNumber, 50);

    services.push(...page.services);

    numberOfPages = page.numberOfPages;
    pageNumber += 1;
  }

  return { services };
};

const getEmailToggleFlag = async (params) => {
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    return await fetchApi(`${config.applications.service.url}${params}`, {
      method: "GET",
      headers: {
        authorization: `bearer ${token}`,
      },
    });
  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
};

const retrieveToggleFlag = async (path) => {
  const emailToggleFlag = await getEmailToggleFlag(path);
  if (emailToggleFlag && emailToggleFlag.length === 1) {
    return emailToggleFlag[0].flag;
  }
  return true;
};

const isSupportEmailNotificationAllowed = async () => {
  return await retrieveToggleFlag(supportTogglePath);
};

module.exports = {
  createService,
  getServiceById,
  getPageOfService,
  getAllServices,
  isSupportEmailNotificationAllowed,
};
