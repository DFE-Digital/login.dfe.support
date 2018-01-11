const users = require('./../../infrastructure/users');

const action = async (req, res) => {
  const criteria = req.body.criteria;
  const results = criteria ? await users.search(criteria) : [];

  res.render('users/views/search', {
    criteria,
    csrfToken: req.csrfToken(),
    users: results ? results : [],
  });
};

module.exports = action;