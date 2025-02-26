const { editOrganisation } = require("../../infrastructure/organisations");
const logger = require("../../infrastructure/logger");

const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const postConfirmEditOrganisation = async (req, res) => {
  if (!req.session.editOrgFormData) {
    return res.redirect(`/organisations/${req.params.id}/users`);
  }
  const correlationId = req.id;
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);
  const { name, address } = req.session.editOrgFormData;

  const body = {
    name,
    address,
  };

  logger.audit(
    `User: ${req.user.email} (id: ${req.user.sub}) - About to update organisation ${organisation.name}: Org id: ${req.params.id}`,
    {
      type: "support",
      subType: "org-edit",
      userId: req.user.sub,
      organisationId: req.params.id,
    },
  );

  await editOrganisation(organisation.id, body, correlationId);

  logger.audit(
    `Organisation ${organisation.name} (id: ${req.params.id}) successfully updated`,
    {
      type: "support",
      subType: "org-edit",
      userId: req.user.sub,
      organisationId: req.params.id,
    },
  );

  res.flash("info", "Organisation details updated");
  req.session.editOrgFormData = undefined;

  return res.redirect(`/organisations/${organisation.id}/users`);
};

module.exports = postConfirmEditOrganisation;
