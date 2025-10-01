const { getAllServicesForUserInOrg } = require("./utils");
const {
  getInvitationOrganisations,
} = require("./../../infrastructure/organisations");
const {
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");

const getDeleteOrganisation = async (req, res) => {
  const userId = req.params.uid;
  const userOrganisations = userId.startsWith("inv-")
    ? await getInvitationOrganisations(userId.substr(4), req.id)
    : await getUserOrganisationsWithServicesRaw({ userId });
  const organisationDetails = userOrganisations.find(
    (x) => x.organisation.id === req.params.id,
  );
  req.session.org = organisationDetails.organisation;
  const servicesForUser = await getAllServicesForUserInOrg(
    userId,
    req.params.id,
  );

  return res.render("users/views/removeOrganisation", {
    backLink: true,
    csrfToken: req.csrfToken(),
    organisationDetails,
    services: servicesForUser,
    user: {
      firstName: req.session.user.firstName,
      lastName: req.session.user.lastName,
      email: req.session.user.email,
      uid: req.params.uid,
    },
  });
};

module.exports = getDeleteOrganisation;
