const {
  getSearchIndexUsersRaw,
  mapSupportUserSortByToSearchApi,
} = require("login.dfe.api-client/users");

const {
  mapSearchUserToSupportModel,
} = require("./mapSearchUserToSupportModel");

async function searchAndMapUsers(searchParams) {
  const { criteria, pageNumber, sortBy, sortAsc, filterBy } = searchParams;

  const mappedSortBy = sortBy
    ? mapSupportUserSortByToSearchApi({ sortBy })
    : undefined;

  let sortDirection;
  if (sortAsc === true) {
    sortDirection = "asc";
  } else if (sortAsc === false) {
    sortDirection = "desc";
  }

  const results = await getSearchIndexUsersRaw({
    searchCriteria: criteria,
    pageNumber,
    sortBy: mappedSortBy,
    sortDirection,
    filterBy,
  });

  return {
    numberOfPages: results.numberOfPages,
    totalNumberOfResults: results.totalNumberOfResults,
    users: results.users.map(mapSearchUserToSupportModel),
  };
}

module.exports = {
  searchAndMapUsers,
};
