const { sendResult } = require("../../infrastructure/utils");
const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const getEditOrganisation = async (req, res) => {
  console.log('getEditOrganisation called');
  const organisation = await getOrganisationByIdV2(req.params.id, req.id);

  sendResult(req, res, "organisations/views/editOrganisation", {
      csrfToken: req.csrfToken(),
      organisation
    });
}

module.exports = getEditOrganisation;