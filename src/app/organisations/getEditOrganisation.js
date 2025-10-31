const { sendResult } = require("../../infrastructure/utils");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");

const getEditOrganisation = async (req, res) => {
  const organisation = await getOrganisationRaw({
    by: { organisationId: req.params.id },
  });

  sendResult(req, res, "organisations/views/editOrganisation", {
    csrfToken: req.csrfToken(),
    backlink: "users",
    currentPage: "organisations",
    organisation,
    validationMessages: {},
  });
};

module.exports = getEditOrganisation;
