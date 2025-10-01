const { sendResult } = require("../../infrastructure/utils");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");

const getConfirmEditOrganisation = async (req, res) => {
  const organisation = await getOrganisationRaw({
    by: { organisationId: req.params.id },
  });

  if (!req.session.editOrgFormData) {
    return res.redirect(`/organisations/${organisation.id}/users`);
  }

  const { name, address } = req.session.editOrgFormData;

  sendResult(req, res, "organisations/views/confirmEditOrganisation", {
    csrfToken: req.csrfToken(),
    backlink: "edit-organisation",
    organisation,
    name,
    address,
    validationMessages: {},
  });
};

module.exports = getConfirmEditOrganisation;
