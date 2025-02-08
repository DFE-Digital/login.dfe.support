// const { sendResult } = require("../../infrastructure/utils");
const {
  getOrganisationByIdV2,
} = require("./../../infrastructure/organisations");

const postEditOrganisation = async (req, res) => {
    console.log('postEditOrganisation called');
    const organisation = await getOrganisationByIdV2(req.params.id, req.id);
  // console.log('organisation: ', organisation);
    console.log('BODY: ', req.body);
    const { legalName, address } = req.body;
    console.log(legalName, address);
    
    req.session.formData = { legalName, address };
    return res.redirect(`/organisations/${organisation.id}/confirm-edit-organisation`);

    // sendResult(req, res, "organisations/views/confirmEditOrganisation", {
    //     csrfToken: req.csrfToken(),
    //     // layout: "sharedViews/layoutNew.ejs",
    //     organisation,
    //   });

}

module.exports = postEditOrganisation;