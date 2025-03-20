const { sendResult } = require("../../infrastructure/utils");

const getChooseServiceType = async (req, res) => {
  const model = req.session.createServiceData
    ? req.session.createServiceData
    : {};

  sendResult(req, res, "services/views/chooseServiceType", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layoutNew.ejs",
    currentPage: "services",
    backLink: true,
    cancelLink: "/users",
    validationMessages: {},
    serviceType: model.serviceType,
    hideFromUserServices: model.hideFromUserServices,
    hideFromContactUs: model.hideFromContactUs,
  });
};

module.exports = getChooseServiceType;
