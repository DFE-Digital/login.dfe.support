const { searchOrganisations } = require('./../../infrastructure/organisations');
const { sendResult } = require('./../../infrastructure/utils');

const postAssociateOrganisation = async (req, res) => {
  const selectedOrganisation = req.body.selectedOrganisation;
  if (selectedOrganisation) {
    req.session.newUser.organisationId = selectedOrganisation;
    return res.redirect('/organisation-permissions');
  }

  const criteria = req.body.criteria;
  const currentPage = req.body.page;

  const searchResult = await searchOrganisations(criteria, currentPage, req.id);
  const results = searchResult.organisations;
  const numberOfPages = searchResult.totalNumberOfPages;
  const numberOfResults = searchResult.totalNumberOfRecords;
  const firstRecordNumber = ((currentPage - 1) * 25) + 1;
  let lastRecordNumber = (firstRecordNumber + (currentPage === numberOfPages ? results.length : 25)) - 1;

  return sendResult(req, res, 'users/views/associateOrganisation', {
    csrfToken: req.csrfToken(),
    criteria,
    results,
    currentPage,
    numberOfPages,
    numberOfResults,
    firstRecordNumber,
    lastRecordNumber,
  });
};

module.exports = postAssociateOrganisation;
