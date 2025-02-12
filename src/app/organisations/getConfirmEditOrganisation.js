const { sendResult } = require("../../infrastructure/utils");
const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const getConfirmEditOrganisation = async (req, res) => {
  if (!req.session.formData) {
    return res.redirect("/organisations");
  }

  const organisation = await getOrganisationByIdV2(req.params.id, req.id);
  const { name, address } = req.session.formData;

  sendResult(req, res, "organisations/views/confirmEditOrganisation", {
    csrfToken: req.csrfToken(),
    organisation,
    name,
    address,
    validationMessages: {},
  });
};

module.exports = getConfirmEditOrganisation;
