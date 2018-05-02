const getNewUser = (req, res) => {
  const model = {
    csrfToken: req.csrfToken(),
    firstName: '',
    lastName: '',
    email: '',
    validationMessages: {},
  };

  if (req.session.newUser) {
    model.firstName = req.session.newUser.firstName;
    model.lastName = req.session.newUser.lastName;
    model.email = req.session.newUser.email;
  }

  res.render('users/views/newUser', model);
};

module.exports = getNewUser;
