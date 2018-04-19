const getNewUser = (req, res) => {
  res.render('users/views/newUser', {
    csrfToken: req.csrfToken(),
    firstName: '',
    lastName: '',
    email: '',
    validationMessages: {},
  });
};

module.exports = getNewUser;
