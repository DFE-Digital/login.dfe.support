const { search } = require('./utils');
const { sendResult } = require('./../../infrastructure/utils');
const config = require('./../../infrastructure/config');

const clearNewUserSessionData = (req) => {
  if (req.session.k2sUser) {
    req.session.k2sUser = undefined;
  }
  if(req.session.user){
    req.session.user = undefined;
  }
  if (req.session.digipassSerialNumberToAssign) {
    req.session.digipassSerialNumberToAssign = undefined;
  }
};

const doSearchAndBuildModel = async (req) => {
  const result = await search(req);


  const paramsSource = req.method === 'POST' ? req.body : req.query;
  let showFilters = false;
  if (paramsSource.showFilters !== undefined && paramsSource.showFilters.toLowerCase() === 'true') {
    showFilters = true;
  }

  return {
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
  };
};

const get = async (req, res) => {
  clearNewUserSessionData(req);

  const model = await doSearchAndBuildModel(req);
  sendResult(req, res, 'users/views/search', model);
};

const post = async (req, res) => {
  const model = await doSearchAndBuildModel(req);
  sendResult(req, res, 'users/views/search', model);
};

module.exports = {
  get,
  post,
};
