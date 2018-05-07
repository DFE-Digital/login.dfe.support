const { search } = require('./utils');
const { sendResult } = require('./../../infrastructure/utils');
const config = require('./../../infrastructure/config');

const action = async (req, res) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;
  const result = await search(req);

  let showFilters = false;
  if (paramsSource.showFilters !== undefined && paramsSource.showFilters.toLowerCase() === 'true') {
    showFilters = true;
  }

  sendResult(req, res, 'users/views/search', {
    csrfToken: req.csrfToken(),
    criteria: result.criteria,
    page: result.page,
    numberOfPages: result.numberOfPages,
    totalNumberOfResults: result.totalNumberOfResults,
    users: result.users,
    sort: result.sort,
    sortBy: result.sortBy,
    sortOrder: result.sortOrder,
    useGenericAddUser: config.toggles.useGenericAddUser,

    showFilters,
  });
};

module.exports = action;