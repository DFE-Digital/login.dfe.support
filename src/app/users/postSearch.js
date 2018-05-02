const { search } = require('./utils');
const { sendResult } = require('./../../infrastructure/utils');
const config = require('./../../infrastructure/config');

const action = async (req, res) => {
  const result = await search(req);

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
  });
};

module.exports = action;