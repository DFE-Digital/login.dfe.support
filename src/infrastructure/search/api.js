const jwtStrategy = require('login.dfe.jwt-strategies');
const config = require('./../config');
const KeepAliveAgent = require('agentkeepalive').HttpsAgent;
const rp = require('login.dfe.request-promise-retry').defaults({
  agent: new KeepAliveAgent({
    maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
    maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
    timeout: config.hostingEnvironment.agentKeepAlive.timeout,
    keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
  }),
});
const { mapUserStatus } = require('./../../infrastructure/utils');

const callApi = async (endpoint, method, body, correlationId) => {
  const token = await jwtStrategy(config.search.service).getBearerToken();

  try {
    return await rp({
      method: method,
      uri: `${config.search.service.url}${endpoint}`,
      headers: {
        authorization: `bearer ${token}`,
        'x-correlation-id': correlationId,
      },
      body: body,
      json: true,
      strictSSL: config.hostingEnvironment.env.toLowerCase() !== 'dev',
    });
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404) {
      return undefined;
    }
    throw e;
  }
};
const mapSearchUserToSupportModel = (user) => {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    organisation: user.primaryOrganisation ? {
      name: user.primaryOrganisation
    } : null,
    lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
    successfulLoginsInPast12Months: user.numberOfSuccessfulLoginsInPast12Months,
    status: mapUserStatus(user.statusId, user.statusLastChangedOn),
    pendingEmail: user.pendingEmail,
  };
};

const seachForUsers = async (criteria, pageNumber, sortBy, sortDirection, filters) => {
  try {
    let endpoint = `/users?criteria=${criteria}&page=${pageNumber}`;
    if (sortBy) {
      endpoint += `&sortBy=${sortBy}`;
    }
    if (sortDirection) {
      endpoint += `&sortDirection=${sortDirection}`;
    }
    if (filters) {
      const properties = Object.keys(filters);
      properties.forEach((property) => {
        const values = filters[property];
        endpoint += values.join(v => `&filter_${property}=${v}`);
      });
    }
    const results = await callApi(endpoint, 'GET');
    return {
      numberOfPages: results.numberOfPages,
      totalNumberOfResults: results.totalNumberOfResults,
      users: results.users.map(mapSearchUserToSupportModel)
    }
  } catch (e) {
    throw new Error(`Error searching for users with criteria ${criteria} (page: ${pageNumber}) - ${e.message}`);
  }
};

const getSearchDetailsForUserById = async (id) => {
  try {
    const user = await callApi(`/users/${id}`, 'GET');
    return user ? mapSearchUserToSupportModel(user) : undefined;
  } catch (e) {
    throw new Error(`Error getting user ${id} from search - ${e.message}`);
  }
};

const updateUserInSearch = async (user, correlationId) => {
  const body = {
    pendingEmail: user.pendingEmail,
    statusId: user.status.id,
    firstName: user.firstName,
    lastName: user.lastName,
  };
  await callApi(`/users/${user.id}`, 'PATCH', body, correlationId);
};

module.exports = {
  seachForUsers,
  getSearchDetailsForUserById,
  updateUserInSearch,
};
