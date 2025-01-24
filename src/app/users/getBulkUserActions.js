const getBulkUserActions = (req, res) => {
  const model = {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layoutNew.ejs",
    currentPage: "users",
    backLink: "../",
    emails: "",
    validationMessages: {},
  };

  res.render("users/views/bulkUserActions", model);
};

module.exports = getBulkUserActions;
