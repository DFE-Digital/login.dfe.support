const { sendResult } = require("./../../infrastructure/utils");
const { dateFormat } = require("../helpers/dateFormatterHelper");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");
const { searchForUsers } = require("./../../infrastructure/search");
const { mapRole } = require("./../users/utils");

const render = async (req, res, dataSource) => {
  const organisation = await getOrganisationRaw({
    by: { organisationId: req.params.id },
  });
  let pageNumber = dataSource.page ? parseInt(dataSource.page) : 1;
  if (isNaN(pageNumber)) {
    pageNumber = 1;
  }

  const results = await searchForUsers("*", pageNumber, undefined, undefined, {
    organisations: [organisation.id],
  });

  const users = results.users.map((user) => {
    const viewUser = Object.assign({}, user);
    viewUser.organisation = Object.assign(
      {},
      user.organisations.find(
        (o) => o.id.toUpperCase() === organisation.id.toUpperCase(),
      ),
    );
    viewUser.organisation.role = mapRole(viewUser.organisation.roleId);
    viewUser.formattedLastLogin = viewUser.lastLogin
      ? dateFormat(viewUser.lastLogin, "shortDateFormat")
      : "";
    return viewUser;
  });
  sendResult(req, res, "organisations/views/users", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layout.ejs",
    backLink: "/organisations",
    organisation: organisation,
    users,
    page: pageNumber,
    numberOfPages: results.numberOfPages,
    totalNumberOfResults: results.totalNumberOfResults,
  });
};

const get = async (req, res) => {
  req.session.params = {
    ...req.session.params,
    ...req.query,
  };

  // Check if it's possible to re-populate search with the current params.
  if (
    req.session.params.showFilters === "true" ||
    (typeof req.session.params.criteria !== "undefined" &&
      req.session.params.criteria !== "")
  ) {
    req.session.params.redirectedFromSearchResult = true;
  } else {
    req.session.params.redirectedFromSearchResult = false;
  }

  // If searchType isn't set or equal to users, set it to organisations.
  // This allows us to avoid populating org search after going from user's profile straight to an org user list.
  if (req.session.params.searchType !== "users") {
    req.session.params.searchType = "organisations";
  }

  return render(req, res, req.query);
};
const post = async (req, res) => {
  return render(req, res, req.body);
};
module.exports = {
  get,
  post,
};
