const { sendResult } = require("../../infrastructure/utils");
const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const getEditOrganisation = async (req, res) => {
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);

  sendResult(req, res, "organisations/views/editOrganisation", {
    csrfToken: req.csrfToken(),
    backlink: "users",
    organisation,
    validationMessages: {},
  });
};

module.exports = getEditOrganisation;
