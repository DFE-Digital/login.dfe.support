const getConfirmNewUser = (req, res) => {
  return res.render('users/views/confirmNewUser', {
    csrfToken: req.csrfToken(),
    user: {
      firstName: req.session.newUser.firstName,
      lastName: req.session.newUser.lastName,
      email: req.session.newUser.email,
    },
    organisation: req.session.newUser.organisationId ? {
      id: req.session.newUser.organisationId,
      name: req.session.newUser.organisationName,
    } : undefined,
  });
};

module.exports = getConfirmNewUser;
