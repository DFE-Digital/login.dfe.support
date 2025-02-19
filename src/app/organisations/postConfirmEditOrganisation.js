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

  logger.info(
    `User: ${req.user.sub} - About to update organisation ${organisation.name}: Org id: ${req.params.id}`,
    {
      correlationId,
    },
  );

  await editOrganisation(organisation.id, body, correlationId);

  logger.info(
    `Organisation ${organisation.name} successfully updated: ${req.params.id}`,
    {
      correlationId,
    },
  );

  res.flash("info", "Organisation details updated");
  req.session.editOrgFormData = undefined;

  return res.redirect(`/organisations/${organisation.id}/users`);
};

module.exports = postConfirmEditOrganisation;
