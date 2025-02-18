const { sendResult } = require("../../infrastructure/utils");
const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const getConfirmEditOrganisation = async (req, res) => {
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);

  if (!req.session.formData) {
    return res.redirect(`/organisations/${organisation.id}/users`);
  }

  const { name, address } = req.session.formData;

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
