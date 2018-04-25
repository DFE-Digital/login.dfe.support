const getOrganisationPermissions = async (req, res) => {
  return res.render('users/views/organisationPermissions', {
    csrfToken: req.csrfToken(),
    userFullName: `${req.session.newUser.firstName} ${req.session.newUser.lastName}`,
    organisationName: req.session.newUser.organisationName,
    selectedLevel: null,
    validationMessages: {},
  });
};

module.exports = getOrganisationPermissions;
