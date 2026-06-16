const { sendResult } = require("../../infrastructure/utils");
const { getAllServices } = require("../services/utils");
const { dateFormat } = require("../helpers/dateFormatterHelper");
const { getUserDetailsById } = require("./utils");

const isTruthy = (v) => v === true || v === 1 || v === "true" || v === "1";
const isHiddenFromSupport = (s) => {
  if (s.isIdOnlyService) {
    const params = s.relyingParty?.params;
    return (
      isTruthy(s.isHiddenService) &&
      isTruthy(params?.hideApprover) &&
      isTruthy(params?.hideSupport) &&
      isTruthy(params?.helpHidden)
    );
  }
  return isTruthy(s.relyingParty?.params?.hideSupport);
};

const buildModel = async (req) => {
  const user = await getUserDetailsById(req.params.uid, req);
  user.formattedLastLogin = user.lastLogin
    ? dateFormat(user.lastLogin, "longDateFormat")
    : "";
  const allServices = await getAllServices();
  const visibleServices = allServices.services.filter(
    (s) => !isHiddenFromSupport(s),
  );
  const totalNumberOfResults = visibleServices.length;
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

  const startIndex = (page - 1) * numberOfResultsOnPage;
  const pageOfServices = {
    services: visibleServices.slice(
      startIndex,
      startIndex + numberOfResultsOnPage,
    ),
  };

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
