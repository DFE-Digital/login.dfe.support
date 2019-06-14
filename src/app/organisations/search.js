const { sendResult } = require('./../../infrastructure/utils');
const { searchOrganisations } = require('./../../infrastructure/organisations');

const doSearchAndBuildModel = async (req) => {
  const inputSource = req.method.toUpperCase() === 'POST' ? req.body : req.query;
  const criteria = inputSource.criteria ? inputSource.criteria.trim() : '';
  let pageNumber = parseInt(inputSource.page) || 1;
  if (isNaN(pageNumber)) {
    pageNumber = 1;
  }

  const pageOfOrganisations = await searchOrganisations(criteria, undefined, pageNumber, req.id);
  return {
    csrfToken: req.csrfToken(),
    criteria: criteria,
    page: pageNumber,
    numberOfPages: pageOfOrganisations.totalNumberOfPages,
    totalNumberOfResults: pageOfOrganisations.totalNumberOfRecords,
    organisations: pageOfOrganisations.organisations,
  }
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
