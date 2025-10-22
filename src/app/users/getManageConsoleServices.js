const { sendResult } = require("../../infrastructure/utils");
const { getAllServices } = require("../services/utils");
const { getPaginatedServicesRaw } = require("login.dfe.api-client/services");
const { dateFormat } = require("../helpers/dateFormatterHelper");
const { getUserDetailsById } = require("./utils");

const buildModel = async (req) => {
  const user = await getUserDetailsById(req);
  user.formattedLastLogin = user.lastLogin
    ? dateFormat(user.lastLogin, "longDateFormat")
    : "";
  const allServices = await getAllServices();
  const totalNumberOfResults = allServices.services.length;
  const numberOfResultsOnPage = 20;
  const numberOfPages = Math.ceil(totalNumberOfResults / numberOfResultsOnPage);
  let paramsSource = req.method === "POST" ? req.body : req.query;

  if (Object.keys(paramsSource).length === 0 && req.session.params) {
    paramsSource = {
      ...req.session.params,
    };
  }

  let page = paramsSource.page ? parseInt(paramsSource.page) : 1;
  if (isNaN(page)) {
    page = 1;
  }

  const pageOfServices = (await getPaginatedServicesRaw({
    pageSize: numberOfResultsOnPage,
    pageNumber: page,
  })) ?? { services: [] };

  const model = {
    csrfToken: req.csrfToken(),
    currentPage: "users",
    backLink: `/users/${user.id}/organisations`,
    layout: "sharedViews/layout.ejs",
    user,
    pageOfServices,
    page,
    numberOfPages,
    numberOfResultsOnPage,
    totalNumberOfResults,
  };

  return model;
};

const getManageConsoleServices = async (req, res) => {
  const model = await buildModel(req);
  sendResult(req, res, "users/views/selectManageConsoleService", model);
};

module.exports = getManageConsoleServices;
