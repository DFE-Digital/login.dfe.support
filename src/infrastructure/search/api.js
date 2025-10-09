const jwtStrategy = require("login.dfe.jwt-strategies");
const config = require("./../config");
const { fetchApi } = require("login.dfe.async-retry");
const {
  mapSearchUserToSupportModel,
} = require("../../app/users/userSearchHelpers/mapSearchUserToSupportModel");

const callApi = async (endpoint, method, body, correlationId) => {
  const token = await jwtStrategy(config.search.service).getBearerToken();

  try {
    return await fetchApi(`${config.search.service.url}${endpoint}`, {
      method: method,
      headers: {
        authorization: `bearer ${token}`,
        "x-correlation-id": correlationId,
      },
      body: body,
    });
  } catch (e) {
    const status = e.statusCode ? e.statusCode : 500;
    if (status === 404 || e.statusCode === 400 || e.statusCode === 403) {
      return undefined;
    }
    throw e;
  }
};

const mapSupportUserSortByToSearchApi = (supportSortBy) => {
  switch (supportSortBy.toLowerCase()) {
    case "name":
      return "searchableName";
    case "email":
      return "searchableEmail";
    case "organisation":
      return "primaryOrganisation";
    case "lastlogin":
      return "lastLogin";
    case "status":
      return "statusId";
    default:
      throw new Error(`Unexpected user sort field ${supportSortBy}`);
  }
};

const searchForUsers = async (
  criteria,
  pageNumber,
  sortBy,
  sortDirection,
  filters,
) => {
  try {
    let endpoint = `/users?criteria=${criteria}&page=${pageNumber}`;
    if (sortBy) {
      endpoint += `&sortBy=${mapSupportUserSortByToSearchApi(sortBy)}`;
    }
    if (sortDirection) {
      endpoint += `&sortDirection=${sortDirection}`;
    }
    if (filters) {
      const properties = Object.keys(filters);
      properties.forEach((property) => {
        const values = filters[property];
        endpoint += values.map((v) => `&filter_${property}=${v}`).join("");
      });
    }
    const results = await callApi(endpoint, "GET");
    return {
      numberOfPages: results.numberOfPages,
      totalNumberOfResults: results.totalNumberOfResults,
      users: results.users.map(mapSearchUserToSupportModel),
    };
  } catch (e) {
    throw new Error(
      `Error searching for users with criteria ${criteria} (page: ${pageNumber}) - ${e.message}`,
    );
  }
};

const updateIndex = async (userId, body, correlationId) => {
  await callApi(`/users/${userId}`, "PATCH", body, correlationId);
};

const createIndex = async (id, correlationId) => {
  const body = {
    id,
  };
  await callApi("/users/update-index", "POST", body, correlationId);
};

module.exports = {
  searchForUsers,
  updateIndex,
  createIndex,
};
