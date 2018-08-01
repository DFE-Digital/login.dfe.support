
const getEditPermissions = async (req, res) => {
  return res.render('users/views/editPermissions', {
    csrfToken: req.csrfToken(),
    userFullName: `${req.session.user.firstName} ${req.session.user.lastName}`,
    validationMessages: {},
  });
};

module.exports = getEditPermissions;
