const getBulkUserActions = (req, res) => {
  const model = {
    csrfToken: req.csrfToken(),
    emails: '',
    validationMessages: {},
  };

  if (req.session.user) {
    model.emails = req.session.user.email;
  }

  res.render('users/views/bulkUserActions', model);
};

module.exports = getBulkUserActions;
