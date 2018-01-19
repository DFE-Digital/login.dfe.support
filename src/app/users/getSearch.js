const { search } = require('./utils');

const action = async (req, res) => {
  const result = await search(req);

  res.render('users/views/search', {
    csrfToken: req.csrfToken(),
    criteria: result.criteria,
    page: result.page,
    numberOfPages: result.numberOfPages,
    users: result.users,
    sort: result.sort,
  });
};

module.exports = action;