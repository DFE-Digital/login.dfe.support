const { sendResult } = require('../../infrastructure/utils');
const { searchOrganisations, getOrganisationCategories, listOrganisationStatus } = require('../../infrastructure/organisations');

const getFiltersModel = async (req) => {
  const fromRedirect = req.session.params ? req.session.params : null;
  let paramsSource = req.method === 'POST' ? req.body : req.query;
  if (Object.keys(paramsSource).length === 0 && fromRedirect) {
    paramsSource = {
      ...req.session.params
    }
  }

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

const search = async (req) => {
  let inputSource = req.method.toUpperCase() === 'POST' ? req.body : req.query;

  if (req.session.params && Object.keys(inputSource).length === 0) {
    inputSource = {
      ...req.session.params
    };
  }

  let criteria = inputSource.criteria ? inputSource.criteria.trim() : '';

  const organisationRegex = /^[a-zA-Z0-9\s-'&(),.@\\/:]{1,256}$/;
  let filteredError;
  /**
   * Check minimum characters and special characters in search criteria if:
   * user is not using the filters toggle (to open or close) and filters are not visible
   */
  if (inputSource.isFilterToggle !== 'true' && inputSource.showFilters !== 'true') {
    if (!criteria || criteria.length < 4) {
      return {
        validationMessages: {
          criteria: 'Please enter at least 4 characters',
        },
      };
    }
    if (!organisationRegex.test(criteria)) {
      return {
        validationMessages: {
          criteria: 'Special characters cannot be used',
        },
      };
    }
  /**
   * Check special characters in search criteria if:
   * user is filtering filtering and had specified a criteria
   */
  } else if (!organisationRegex.test(criteria) && criteria.length > 0) {
    criteria = '';
    // here we normally just return the error but we
    // want to keep the last set of filtered results
    // and append the error to the result
    filteredError = {
      criteria: 'Special characters cannot be used',
    };
  }

  const orgTypes = unpackMultiSelect(inputSource.organisationType);
  const orgStatuses = unpackMultiSelect(inputSource.organisationStatus);
  let pageNumber = parseInt(inputSource.page) || 1;
  if (isNaN(pageNumber)) {
    pageNumber = 1;
  }

  const pageOfOrganisations = await searchOrganisations(criteria, orgTypes , orgStatuses, pageNumber, req.id);
  const result = {
    criteria,
    page: pageNumber,
    numberOfPages: pageOfOrganisations.totalNumberOfPages,
    totalNumberOfResults: pageOfOrganisations.totalNumberOfRecords,
    organisations: pageOfOrganisations.organisations,
    validationMessages: filteredError,
  };

  return result;
};

const buildModel = async (req, result = {}) => {
  const model = {
    csrfToken: req.csrfToken(),
    criteria: result.criteria,
    page: result.page,
    numberOfPages: result.numberOfPages,
    totalNumberOfResults: result.totalNumberOfResults,
    organisations: result.organisations,
    validationMessages: result.validationMessages || {},
  };
  const filtersModel = await getFiltersModel(req);
  return Object.assign(model, filtersModel);
};

const doSearchAndBuildModel = async (req) => {
  const result = await search(req);
  const model = await buildModel(req, result);
  return model;
};

const get = async (req, res) => {
  const model = await buildModel(req);

  if (!req.session.params?.redirectedFromSearchResult && req.session.params) {
    req.session.params = undefined;
  }

  if (req.session.params?.redirectedFromSearchResult) {
    req.session.params.redirectedFromSearchResult = undefined;
    await post(req, res);
  } else {
    const model = await buildModel(req);
    sendResult(req, res, 'organisations/views/search', model);
  }

};

const post = async (req, res) => {
  const model = await doSearchAndBuildModel(req);
  sendResult(req, res, 'organisations/views/search', model);
};

module.exports = {
  get,
  post,
};
