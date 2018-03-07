const { search } = require('./utils');
const { sendResult } = require('./../../infrastructure/utils');

const action = async (req, res) => {
  const result = await search(req);

  sendResult(req, res, 'userDevices/views/search', {
    csrfToken: req.csrfToken(),
    criteria: result.criteria,
    page: result.page,
    numberOfPages: result.numberOfPages,
    totalNumberOfResults: result.totalNumberOfResults,
    userDevices: result.userDevices,
    sort: result.sort,
    sortBy: result.sortBy,
    sortOrder: result.sortOrder,
  });
};

module.exports = action;
