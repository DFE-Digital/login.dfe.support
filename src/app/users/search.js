const { search } = require('./utils');
const { sendResult } = require('./../../infrastructure/utils');
const { userStatusMap } = require('./../../infrastructure/utils');
const config = require('./../../infrastructure/config');
const { getAllServices, getOrganisationCategories } = require('./../../infrastructure/organisations');

const clearNewUserSessionData = (req) => {
  if (req.session.k2sUser) {
    req.session.k2sUser = undefined;
  }
  if (req.session.user) {
    req.session.user = undefined;
  }
  if (req.session.digipassSerialNumberToAssign) {
    req.session.digipassSerialNumberToAssign = undefined;
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
  const paramsSource = req.method === 'POST' ? req.body : req.query;
  let showFilters = false;
  if (paramsSource.showFilters !== undefined && paramsSource.showFilters.toLowerCase() === 'true') {
    showFilters = true;
  }

  let organisationTypes = [];
  let accountStatuses = [];
  let services = [];

  if (showFilters) {
    const selectedOrganisationTypes = unpackMultiSelect(paramsSource.organisationType);
    organisationTypes = (await getOrganisationCategories(req.id)).map((category) => {
      return {
        id: category.id,
        name: category.name,
        isSelected: selectedOrganisationTypes.find(x => x.toLowerCase() === category.id.toLowerCase()) !== undefined,
      };
    });

    const selectedAccountStatuses = unpackMultiSelect(paramsSource.accountStatus);
    accountStatuses = userStatusMap.map((status) => {
      return {
        id: status.id,
        name: status.name,
        isSelected: selectedAccountStatuses.find(x => x === status.id.toString()) !== undefined,
      };
    });

    const selectedServices = unpackMultiSelect(paramsSource.service);
    services = (await getAllServices(req.id)).map((service) => {
      return {
        id: service.id,
        name: service.name,
        isSelected: selectedServices.find(x => x.toLowerCase() === service.id.toLowerCase()) !== undefined,
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

const doSearchAndBuildModel = async (req) => {
  const result = await search(req);

  const searchModel = {
    csrfToken: req.csrfToken(),
    criteria: result.criteria,
    page: result.page,
    numberOfPages: result.numberOfPages,
    totalNumberOfResults: result.totalNumberOfResults,
    users: result.users,
    sort: result.sort,
    sortBy: result.sortBy,
    sortOrder: result.sortOrder,
    useGenericAddUser: config.toggles.useGenericAddUser,
  };
  const filtersModel = await getFiltersModel(req);

  return Object.assign(searchModel, filtersModel);
};

const get = async (req, res) => {
  clearNewUserSessionData(req);

  const model = await doSearchAndBuildModel(req);
  sendResult(req, res, 'users/views/search', model);
};

const post = async (req, res) => {
  const model = await doSearchAndBuildModel(req);
  sendResult(req, res, 'users/views/search', model);
};

module.exports = {
  get,
  post,
};