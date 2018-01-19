const users = require('./../../infrastructure/users');

const search = async (req) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;
  const criteria = paramsSource.criteria;
  let page = paramsSource.page ? parseInt(paramsSource.page) : 1;
  if (isNaN(page)) {
    page = 1;
  }

  const results = criteria ? await users.search(criteria, page) : { users: [], numberOfPages: 0 };

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
