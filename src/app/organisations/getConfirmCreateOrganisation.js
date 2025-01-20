const { sendResult } = require('../../infrastructure/utils');

const getConfirmCreateOrganisation = async (req, res) => {
  if (!req.session.createOrgData) {
    return res.redirect('/organisations');
  }

  sendResult(req, res, 'organisations/views/confirmCreateOrganisation', {
    csrfToken: req.csrfToken(),
    layout: 'sharedViews/layoutNew.ejs',
    currentPage: 'organisations',
    backLink: true,
    validationMessages: {},
    name: req.session.createOrgData.name,
    address: req.session.createOrgData.address,
    ukprn: req.session.createOrgData.ukprn,
    category: req.session.createOrgData.category,
    upin: req.session.createOrgData.upin,
    urn: req.session.createOrgData.urn,
  });
};

module.exports = getConfirmCreateOrganisation;
