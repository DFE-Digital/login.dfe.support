const { sendResult } = require('../../infrastructure/utils');

const getCreateOrganisation = async (req, res) => {
  sendResult(req, res, 'organisations/views/createOrganisation', {
    csrfToken: req.csrfToken(),
    layout: 'sharedViews/layoutNew.ejs',
    currentPage: 'organisations',
    backLink: true,
    validationMessages: {},
  });
};

module.exports = getCreateOrganisation;
