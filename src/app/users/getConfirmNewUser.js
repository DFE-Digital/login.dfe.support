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
      firstName: req.session.user.firstName,
      lastName: req.session.user.lastName,
      email: req.session.user.email,
    },
    organisation: req.session.user.organisationId ? {
      id: req.session.user.organisationId,
      name: req.session.user.organisationName,
    } : undefined,
    role: req.session.user.organisationId ? {
      id: req.session.user.permission,
      name: getRoleName(req.session.user.permission),
    } : '',
  });
};

module.exports = getConfirmNewUser;
