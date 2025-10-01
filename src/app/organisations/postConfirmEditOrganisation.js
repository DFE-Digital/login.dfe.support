const { editOrganisation } = require("../../infrastructure/organisations");
const logger = require("../../infrastructure/logger");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");

const postConfirmEditOrganisation = async (req, res) => {
  if (!req.session.editOrgFormData) {
    return res.redirect(`/organisations/${req.params.id}/users`);
  }
  const correlationId = req.id;
  const organisation = await getOrganisationRaw({
    by: { organisationId: req.params.id },
  });
  const { name, address } = req.session.editOrgFormData;

  const body = {
    name,
    address,
  };

  await editOrganisation(organisation.id, body, correlationId);

  logger.audit(`${req.user.email} edited organisation data`, {
    type: "support",
    subType: "org-edit",
    userId: req.user.sub,
    organisationId: req.params.id,
  });

  res.flash("info", "Organisation details updated");
  req.session.editOrgFormData = undefined;

  return res.redirect(`/organisations/${organisation.id}/users`);
};

module.exports = postConfirmEditOrganisation;
