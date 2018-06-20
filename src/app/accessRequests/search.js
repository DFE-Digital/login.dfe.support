'use strict';
const { sendResult } = require('./../../infrastructure/utils');
const { search } = require('./utils');

const buildModelAndDoSearch = async (req) => {
  let result = await search(req);
  return {
    usersForApproval: result.accessRequests,
    criteria: result.criteria,
    page: result.page,
    numberOfPages: result.numberOfPages,
    totalNumberOfResults: result.totalNumberOfResults,
    sort: result.sort,
    sortBy: result.sortBy,
    sortOrder: result.sortOrder,
    csrfToken: req.csrfToken(),
  };
};

const get = async (req, res) => {
  const model = await buildModelAndDoSearch(req);
  sendResult(req, res, 'accessRequests/views/search', model);
};

const post = async (req, res) => {
  const model = await buildModelAndDoSearch(req);
  sendResult(req, res, 'accessRequests/views/search', model);
};

module.exports = {
  get,
  post,
};