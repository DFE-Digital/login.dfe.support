const { sendResult } = require("../../infrastructure/utils");
const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const getConfirmEditOrganisation = async (req, res) => {
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);
  const { legalName, address } = req.session.formData;

  sendResult(req, res, "organisations/views/confirmEditOrganisation", {
    csrfToken: req.csrfToken(),
    organisation,
    legalName,
    address,
    backLink: true,
    validationMessages: {},
  });

  //   return res.redirect(`/organisations/${organisation.id}/confirm-edit-organisation`);
};

module.exports = getConfirmEditOrganisation;
