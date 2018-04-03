const { search } = require('./utils');
const { sendResult } = require('./../../infrastructure/utils');

const action = async (req, res) => {
  const result = await search(req);

  // Just encase we are back from creating user
  if (req.session.k2sUser) {
    req.session.k2sUser = undefined;
  }
  if(req.session.user){
    req.session.user = undefined;
  }
  if (req.session.digipassSerialNumberToAssign) {
    req.session.digipassSerialNumberToAssign = undefined;
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
  });
};

module.exports = action;
