const { searchOrganisations, getOrganisationById } = require('./../../infrastructure/organisations');
const { sendResult } = require('./../../infrastructure/utils');

const postAssociateOrganisation = async (req, res) => {
  const selectedOrganisationId = req.body.selectedOrganisation;
  const selectedOrganisation = selectedOrganisationId ? await getOrganisationById(selectedOrganisationId, req.id) : undefined;
  if (selectedOrganisation) {
    req.session.user.organisationId = selectedOrganisation.id;
    req.session.user.organisationName = selectedOrganisation.name;
    return res.redirect('organisation-permissions');
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
    canSkip: req.params.uid ? false : true,
  });
};

module.exports = postAssociateOrganisation;
