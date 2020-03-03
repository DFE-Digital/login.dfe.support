const config = require('./../config');

const rp = require('login.dfe.request-promise-retry');
const jwtStrategy = require('login.dfe.jwt-strategies');

const supportTogglePath = '/constants/toggleflags/email/support';

const getServiceById = async (id) => {
  if (!id) {
    return undefined;
  }
  const token = await jwtStrategy(config.applications.service).getBearerToken();
  try {
    const client = await rp({
      method: 'GET',
      uri: `${config.applications.service.url}/services/${id}`,
      headers: {
        authorization: `bearer ${token}`,
      },
      json: true,
    });
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
    const client = await rp({
      method: 'GET',
      uri: `${config.applications.service.url}/services?page=${pageNumber}&pageSize=${pageSize}`,
      headers: {
        authorization: `bearer ${token}`,
      },
      json: true,
    });
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
    return await rp({
      method: 'GET',
      uri: `${config.applications.service.url}${params}`,
      headers: {
        authorization: `bearer ${token}`,
      },
      json: true,
    });

  } catch (e) {
    if (e.statusCode === 404) {
      return undefined;
    }
    throw e;
  }
}

const retrieveToggleFlag = async (path) => {
  const emailToggleFlag = await getEmailToggleFlag(path);
  if (emailToggleFlag && emailToggleFlag.length === 1) {
    return emailToggleFlag[0].flag;
  }
  return true;
}

const isSupportEmailNotificationAllowed = async () => {
  return await retrieveToggleFlag(supportTogglePath);
}

module.exports = {
  getServiceById,
  getPageOfService,
  getAllServices,
  isSupportEmailNotificationAllowed
};
