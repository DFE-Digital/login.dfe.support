const getAssociateOrganisation = async (req, res) => {
  res.render('users/views/associateOrganisation', {
    csrfToken: req.csrfToken(),
    criteria: '',
    results: undefined,
    currentPage: 1,
    numberOfPages: 1,
    numberOfResults: 1,
    firstRecordNumber: 1,
    lastRecordNumber: 1,
  });
};

module.exports = getAssociateOrganisation;