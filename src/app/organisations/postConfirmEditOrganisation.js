// const { sendResult } = require("../../infrastructure/utils");
const {
    getOrganisationByIdV2,
  } = require("./../../infrastructure/organisations");
  
  const postConfirmEditOrganisation = async (req, res) => {
    const organisation = await getOrganisationByIdV2(req.params.id, req.id);
    console.log('organisation: ', organisation);
  
  //   sendResult(req, res, "organisations/views/confirmEditOrganisation", {
  //       csrfToken: req.csrfToken(),
  //       // layout: "sharedViews/layoutNew.ejs",
  //       organisation
  //     });
  
      return res.redirect(`/organisations/${organisation.id}/users`);
  }
  
  module.exports = postConfirmEditOrganisation;