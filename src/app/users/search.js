const { search } = require("./utils");
const { dateFormat } = require("../helpers/dateFormatterHelper");
const { sendResult } = require("./../../infrastructure/utils");
const { userStatusMap } = require("./../../infrastructure/utils");
const config = require("./../../infrastructure/config");
const {
  getOrganisationCategories,
} = require("./../../infrastructure/organisations");
const { getAllServices } = require("../services/utils");

const clearNewUserSessionData = (req) => {
  if (req.session.user) {
    req.session.user = undefined;
  }
  if (req.session.createServiceData) {
    req.session.createServiceData = undefined;
  }
};

const unpackMultiSelect = (parameter) => {
  if (!parameter) {
    return [];
  }
  if (!(parameter instanceof Array)) {
    return [parameter];
  }
  return parameter;
};

const getFiltersModel = async (req) => {
  const fromRedirect = req.session.params ? req.session.params : null;
  let paramsSource = req.method === "POST" ? req.body : req.query;
  if (Object.keys(paramsSource).length === 0 && fromRedirect) {
    paramsSource = {
      ...req.session.params,
    };
  }

  let showFilters = false;
  if (
    paramsSource.showFilters !== undefined &&
    paramsSource.showFilters.toLowerCase() === "true"
  ) {
    showFilters = true;
  }

  let organisationTypes = [];
  let accountStatuses = [];
  let services = [];

  if (showFilters) {
    const selectedOrganisationTypes = unpackMultiSelect(
      paramsSource.organisationType || paramsSource.organisationCategories,
    );
    organisationTypes = (await getOrganisationCategories(req.id)).map(
      (category) => {
        return {
          id: category.id,
          name: category.name,
          isSelected:
            selectedOrganisationTypes.find(
              (x) => x.toLowerCase() === category.id.toLowerCase(),
            ) !== undefined,
        };
      },
    );

    const selectedAccountStatuses = unpackMultiSelect(
      paramsSource.accountStatus || paramsSource.statusId,
    );
    accountStatuses = userStatusMap.map((status) => {
      return {
        id: status.id,
        name: status.name,
        isSelected:
          selectedAccountStatuses.find((x) => x === status.id.toString()) !==
          undefined,
      };
    });

    const selectedServices = unpackMultiSelect(
      paramsSource.service || paramsSource.services,
    );
    const getAll = await getAllServices();
    services = getAll.services.map((service) => {
      return {
        id: service.id,
        name: service.name,
        isSelected:
          selectedServices.find(
            (x) => x.toLowerCase() === service.id.toLowerCase(),
          ) !== undefined,
      };
    });
  }

  return {
    showFilters,
    organisationTypes,
    accountStatuses,
    services,
  };
};

const buildModel = async (req, result = {}) => {
  const model = {
    csrfToken: req.csrfToken(),
    criteria: result.criteria,
    page: result.page,
    layout: "sharedViews/layout.ejs",
    currentPage: "users",
    numberOfPages: result.numberOfPages,
    totalNumberOfResults: result.totalNumberOfResults,
    users: result.users,
    sort: result.sort,
    sortBy: result.sortBy,
    sortOrder: result.sortOrder,
    useGenericAddUser: config.toggles.useGenericAddUser,
    canViewRequests: req.user ? req.user.isRequestApprover : null,
    validationMessages: result.validationMessages || {},
  };
  const filtersModel = await getFiltersModel(req);

  return Object.assign(model, filtersModel);
};

const doSearchAndBuildModel = async (req) => {
  const result = await search(req);
  if (!result.validationMessages) {
    result.users = result.users.map((user) => ({
      ...user,
      formattedLastLogin: user.lastLogin
        ? dateFormat(user.lastLogin, "shortDateFormat")
        : "",
    }));
  }
  const model = await buildModel(req, result);
  return model;
};

const get = async (req, res) => {
  clearNewUserSessionData(req);

  if (
    (!req.session.params?.redirectedFromSearchResult && req.session.params) ||
    req.session.params?.searchType === "organisations"
  ) {
    req.session.params = undefined;
  }

  if (req.session.params?.redirectedFromSearchResult) {
    req.session.params.redirectedFromSearchResult = undefined;
    await post(req, res);
  } else if (req?.query?.search ?? "" === " true") {
    await post(req, res);
  } else {
    const model = await buildModel(req);
    sendResult(req, res, "users/views/search", model);
  }
};

const post = async (req, res) => {
  const model = await doSearchAndBuildModel(req);
  sendResult(req, res, "users/views/search", model);
};

module.exports = {
  get,
  post,
};
