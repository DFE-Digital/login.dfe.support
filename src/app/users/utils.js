const users = require('./../../infrastructure/users');
const logger = require('./../../infrastructure/logger');

const search = async (req) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;
  const criteria = paramsSource.criteria;
  let page = paramsSource.page ? parseInt(paramsSource.page) : 1;
  if (isNaN(page)) {
    page = 1;
  }

  const results = criteria ? await users.search(criteria, page) : { users: [], numberOfPages: 0 };
  logger.audit(`${req.user.email} (id: ${req.user.sub}) searched for users in support using criteria "${criteria}"`, {
    type: 'support',
    subType: 'user-search',
    userId: req.user.sub,
    userEmail: req.user.email,
    criteria: criteria,
    pageNumber: page,
    numberOfPages: results.numberOfPages,
  });

  return {
    criteria,
    page,
    numberOfPages: results.numberOfPages,
    users: results.users,
  };
};

module.exports = {
  search,
};
