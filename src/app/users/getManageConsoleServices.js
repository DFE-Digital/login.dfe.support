const { sendResult } = require('../../infrastructure/utils');
const { getAllServices, getPageOfService  } = require('../../infrastructure/applications');
const { dateFormat } = require('../helpers/dateFormatterHelper');
const { getUserDetails } = require('./utils');

const buildModel = async (req) => {
  const user = await getUserDetails(req);
  user.formattedLastLogin = user.lastLogin ? dateFormat(user.lastLogin, 'longDateFormat') : '';
  const allServices = await getAllServices(); 
  const totalNumberOfResults = allServices.services.length;
  const numberOfResultsOnPage = 20;
  const numberOfPages = Math.ceil(totalNumberOfResults / numberOfResultsOnPage);
  let paramsSource = req.method === 'POST' ? req.body : req.query;
  
  if (Object.keys(paramsSource).length === 0 && req.session.params) {
    paramsSource = {
      ...req.session.params,
    };
  }
  
  let page = paramsSource.page ? parseInt(paramsSource.page) : 1;
  if (isNaN(page)) {
    page = 1;
  };

  const pageOfServices = (await getPageOfService(page, numberOfResultsOnPage)) ?? {services: []};
  
  const model = {
    csrfToken: req.csrfToken(),
    backLink: `/users/${user.id}/organisations`,
    user,
    pageOfServices,
    page,
    numberOfPages,
    numberOfResultsOnPage,
    totalNumberOfResults
  }

  return model;
}

const getManageConsoleServices = async (req, res) => {
  const model = await buildModel(req);
  sendResult(req, res, 'users/views/selectManageConsoleService', model);
};

module.exports = getManageConsoleServices;