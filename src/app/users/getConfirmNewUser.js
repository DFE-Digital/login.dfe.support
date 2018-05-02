const getRoleName = (id) => {
  switch (id) {
    case 0:
      return 'End user';
    case 10000:
      return 'Approver';
    default:
      throw new Error(`Unrecognised role ${id}`);
  }
};

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
    role: {
      id: req.session.newUser.permission,
      name: getRoleName(req.session.newUser.permission),
    },
  });
};

module.exports = getConfirmNewUser;
