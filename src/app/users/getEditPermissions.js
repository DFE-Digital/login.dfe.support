const {
  getOrganisationById,
  getUserOrganisations,
  getInvitationOrganisations,
} = require("./../../infrastructure/organisations");

const getOrganisations = async (userId, correlationId) => {
  const orgMapping = userId.startsWith("inv-")
    ? await getInvitationOrganisations(userId.substr(4), correlationId)
    : await getUserOrganisations(userId, correlationId);
  if (!orgMapping) {
    return [];
  }

  const organisations = await orgMapping.map((invitation) => {
    return {
      id: invitation.organisation.id,
      name: invitation.organisation.name,
      role: invitation.role,
    };
  });
  return organisations;
};

const getEditPermissions = async (req, res) => {
  const selectedOrganisationId = req.params.id;
  const organisation = selectedOrganisationId
    ? await getOrganisationById(selectedOrganisationId, req.id)
    : undefined;
  req.session.org = organisation;
  const organisationDetails = await getOrganisations(req.params.uid, req.id);
  let role;

  for (let i = 0; i < organisationDetails.length; i++) {
    const org = organisationDetails[i];
    if (selectedOrganisationId === org.id) {
      role = org.role;
    }
  }
  return res.render("users/views/editPermissions", {
    csrfToken: req.csrfToken(),
    backLink: true,
    organisation,
    role,
    userId: req.params.uid,
    userFullName: `${req.session.user.firstName} ${req.session.user.lastName}`,
    validationMessages: {},
  });
};

module.exports = getEditPermissions;
