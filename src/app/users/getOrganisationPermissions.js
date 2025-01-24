const getOrganisationPermissions = async (req, res) => {
  return res.render("users/views/organisationPermissions", {
    csrfToken: req.csrfToken(),
    userFullName: `${req.session.user.firstName} ${req.session.user.lastName}`,
    organisationName: req.session.user.organisationName,
    selectedLevel: req.session.user.permission || 0,
    validationMessages: {},
  });
};

module.exports = getOrganisationPermissions;
