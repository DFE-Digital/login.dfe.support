const getBulkUserActions = (req, res) => {
  const model = {
    csrfToken: req.csrfToken(),
    emails: '',
    validationMessages: {},
  };

  res.render('users/views/bulkUserActions', model);
};

module.exports = getBulkUserActions;
