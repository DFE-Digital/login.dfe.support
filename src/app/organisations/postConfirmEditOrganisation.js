const { editOrganisation } = require("../../infrastructure/organisations");
const logger = require("../../infrastructure/logger");

const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const postConfirmEditOrganisation = async (req, res) => {
  const correlationId = req.id;
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);
  if (!req.session.formData) {
    return res.redirect(`/organisations/${organisation.id}/users`);
  }
  const { name, address } = req.session.formData;

  const body = {
    name,
    address,
  };

  logger.info(`About to update organisation`, {
    correlationId,
  });

  await editOrganisation(organisation.id, body, correlationId);

  logger.info(`Organisation successfully updated`, {
    correlationId,
  });

  res.flash("info", "Organisation details updated");
  req.session.formData = undefined;

  return res.redirect(`/organisations/${organisation.id}/users`);
};

module.exports = postConfirmEditOrganisation;
