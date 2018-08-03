const { getOrganisationById } = require('./../../infrastructure/organisations');

const getEditPermissions = async (req, res) => {
  let organisation;
  const selectedOrganisationId = req.params.id;
  organisation = selectedOrganisationId ? await getOrganisationById(selectedOrganisationId, req.id): undefined;
  req.session.org = organisation;
  return res.render('users/views/editPermissions', {
    csrfToken: req.csrfToken(),
    organisation,
    userFullName: `${req.session.user.firstName} ${req.session.user.lastName}`,
    validationMessages: {},
  });
};

module.exports = getEditPermissions;
