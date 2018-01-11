const action = (req, res) => {
  res.render('users/views/search', {
    criteria: '',
    csrfToken: req.csrfToken(),
    users: []
  });
};

module.exports = action;