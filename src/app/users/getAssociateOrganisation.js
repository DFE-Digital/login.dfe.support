const getAssociateOrganisation = async (req, res) => {
  res.render("users/views/associateOrganisation", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layoutNew.ejs",
    backLink: true,
    criteria: "",
    results: undefined,
    page: 1,
    numberOfPages: 1,
    numberOfResults: 1,
    firstRecordNumber: 1,
    lastRecordNumber: 1,
    canSkip: req.params.uid ? false : true,
  });
};

module.exports = getAssociateOrganisation;
