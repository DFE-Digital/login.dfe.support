const Account = require('./../../infrastructure/directories');
const flatten = require('lodash/flatten');
const uniq = require('lodash/uniq');
const { sendResult } = require('./../../infrastructure/utils');
const { mapStatusForSupport, userStatusMap, unpackMultiSelect, search } = require('./utils');

const getUserDetails = async (usersForApproval) => {
  const allUserId = flatten(usersForApproval.map((user) => user.user_id));
  if (allUserId.length === 0) {
    return [];
  }
  const distinctUserIds = uniq(allUserId);
  return await Account.getUsersByIdV2(distinctUserIds);
};

const getFiltersModel = async (req) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;
  let showFilters = false;
  if (paramsSource.showFilters !== undefined && paramsSource.showFilters.toLowerCase() === 'true') {
    showFilters = true;
  }

  let requestStatuses = [];

  if (showFilters) {
    const selectedRequestStatuses = unpackMultiSelect(paramsSource.status);
    requestStatuses = userStatusMap.map((status) => {
      return {
        id: status.id,
        name: status.name,
        isSelected: selectedRequestStatuses.find(x => x === status.id.toString()) !== undefined,
      };
    });
  }

  return {
    showFilters,
    requestStatuses,
  };
};

const buildModel = async (req) => {
  const result = await search(req);
  const userList = await getUserDetails(result.accessRequests);
  const requests = result.accessRequests.map((user) => {
    const userFound = userList.find(c => c.sub.toLowerCase() === user.user_id.toLowerCase());
    const usersEmail = userFound ? userFound.email : '';
    const usersName = userFound ? `${userFound.given_name} ${userFound.family_name}` : 'No Name Supplied';
    const statusText = mapStatusForSupport(user.status);
    return Object.assign({usersEmail}, {usersName}, {statusText}, user);
  });

  const model = {
    csrfToken: req.csrfToken(),
    title: 'Requests - DfE Sign-in',
    backLink: '/users',
    requests,
    page: result.page,
    numberOfPages: result.numberOfPages,
    totalNumberOfResults: result.totalNumberOfResults,
  };

  const filtersModel = await getFiltersModel(req);

  return Object.assign(model, filtersModel);
};

const get = async (req, res) => {
  const model = await buildModel(req);
  sendResult(req, res, 'accessRequests/views/organisationRequests', model);
};

const post = async (req, res) => {
  const model = await buildModel(req);
  sendResult(req, res, 'accessRequests/views/organisationRequests', model);
};



module.exports = {
  get,
  post,
};
