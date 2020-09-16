const { sendResult } = require('./../../infrastructure/utils');
const { searchOrganisations,getOrganisationCategories, listOrganisationStatus } = require('./../../infrastructure/organisations');

const getFiltersModel = async (req) => {
  const paramsSource = req.method === 'POST' ? req.body : req.query;
  let showFilters = false;
  if (paramsSource.showFilters !== undefined && paramsSource.showFilters.toLowerCase() === 'true') {
    showFilters = true;
  }

  let organisationTypes = [];
  let organisationStatuses = [];
  if (showFilters) {
    const selectedOrganisationTypes = unpackMultiSelect(paramsSource.organisationType);
    const selectedOrganisationStatus = unpackMultiSelect(paramsSource.organisationStatus);
    organisationTypes = (await getOrganisationCategories(req.id)).map((category) => {
      return {
        id: category.id,
        name: category.name,
        isSelected: selectedOrganisationTypes.find(x => x.toLowerCase() === category.id.toLowerCase()) !== undefined,
      };
    });

    organisationStatuses = (await listOrganisationStatus(req.id)).map((status) => {
      return {
        id: status.id,
        name: status.name,
        isSelected: selectedOrganisationStatus.find(x => Number(x)=== status.id) !== undefined,
      };
    });
  }
   return {
    showFilters,
    organisationTypes,
    organisationStatuses,
  };
};

const unpackMultiSelect = (parameter) => {
  if (!parameter) {
    return [];
  }

  if (!(parameter instanceof Array)) {
    return parameter.split(',');
  }
  return parameter;
};

const filterOutCategories = (orgCategories) => {
  return orgCategories.map((cat) => { return cat }).filter((id) => {
    return id !== '004';
  })
}

const doSearchAndBuildModel = async (req) => {
  const inputSource = req.method.toUpperCase() === 'POST' ? req.body : req.query;
  const criteria = inputSource.criteria ? inputSource.criteria.trim() : '';
  const orgTypes = filterOutCategories(unpackMultiSelect(inputSource.organisationType));
  const orgStatuses = unpackMultiSelect(inputSource.organisationStatus);
  let pageNumber = parseInt(inputSource.page) || 1;
  if (isNaN(pageNumber)) {
    pageNumber = 1;
  }

  const pageOfOrganisations = await searchOrganisations(criteria, orgTypes , orgStatuses, pageNumber, req.id);
  const searchModel =  {
    csrfToken: req.csrfToken(),
    criteria: criteria,
    page: pageNumber,
    numberOfPages: pageOfOrganisations.totalNumberOfPages,
    totalNumberOfResults: pageOfOrganisations.totalNumberOfRecords,
    organisations: pageOfOrganisations.organisations,
  }

  const filtersModel = await getFiltersModel(req);

  return Object.assign(searchModel, filtersModel);
};

const get = async (req, res) => {
  const model = await doSearchAndBuildModel(req);
  sendResult(req, res, 'organisations/views/search', model);
};

const post = async (req, res) => {
  const model = await doSearchAndBuildModel(req);
  sendResult(req, res, 'organisations/views/search', model);
};

module.exports = {
  get,
  post,
};
