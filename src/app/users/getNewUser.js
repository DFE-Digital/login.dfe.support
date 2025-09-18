const getNewUser = (req, res) => {
  const model = {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layout.ejs",
    currentPage: "users",
    backLink: "/users",
    firstName: "",
    lastName: "",
    email: "",
    validationMessages: {},
  };

  if (req.session.user) {
    model.firstName = req.session.user.firstName;
    model.lastName = req.session.user.lastName;
    model.email = req.session.user.email;
  }

  res.render("users/views/newUser", model);
};

module.exports = getNewUser;
