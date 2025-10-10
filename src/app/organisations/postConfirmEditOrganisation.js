const logger = require("../../infrastructure/logger");
const { getOrganisationRaw, updateOrganisation } = require("login.dfe.api-client/organisations");

const postConfirmEditOrganisation = async (req, res) => {
  if (!req.session.editOrgFormData) {
    return res.redirect(`/organisations/${req.params.id}/users`);
  }
  const organisation = await getOrganisationRaw({
    by: { organisationId: req.params.id },
  });
  const { name, address } = req.session.editOrgFormData;

  const body = {
    name,
    address,
  };

  const organisationId = organisation.id;

  await updateOrganisation({
    organisationId,
    update: body,
  });

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
