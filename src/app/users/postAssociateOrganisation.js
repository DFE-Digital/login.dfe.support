const {
  searchOrganisations,
  getOrganisationById,
  getCategories,
} = require("../../infrastructure/organisations");
const { sendResult } = require("../../infrastructure/utils");

const postAssociateOrganisation = async (req, res) => {
  const selectedOrganisationId = req.body.selectedOrganisation;
  const selectedOrganisation = selectedOrganisationId
    ? await getOrganisationById(selectedOrganisationId, req.id)
    : undefined;
  if (selectedOrganisation) {
    req.session.user.organisationId = selectedOrganisation.id;
    req.session.user.organisationName = selectedOrganisation.name;
    return res.redirect("organisation-permissions");
  }

  const inputSource =
    req.method.toUpperCase() === "POST" ? req.body : req.query;
  const criteria = inputSource.criteria || "";
  let pageNumber = parseInt(inputSource.page) || 1;
  if (isNaN(pageNumber)) {
    pageNumber = 1;
  }

  const retrieveOrganisationCategories = async () => {
    const orgCategories = await getCategories();
    return orgCategories.map((cat) => cat.id);
  };

  const searchCategories = await retrieveOrganisationCategories();
  const searchResult = await searchOrganisations(
    criteria,
    searchCategories,
    undefined,
    pageNumber,
    req.id,
  );
  const results = searchResult.organisations;
  const numberOfPages = searchResult.totalNumberOfPages;
  const numberOfResults = searchResult.totalNumberOfRecords;

  return sendResult(req, res, "users/views/associateOrganisation", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layout.ejs",
    backLink: true,
    criteria,
    results,
    page: pageNumber,
    numberOfPages,
    numberOfResults,
    canSkip: !req.params.uid,
  });
};

module.exports = postAssociateOrganisation;
