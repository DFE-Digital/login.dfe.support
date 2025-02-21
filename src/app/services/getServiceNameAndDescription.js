const { sendResult } = require("../../infrastructure/utils");

const getServiceNameAndDescription = async (req, res) => {
  sendResult(req, res, "services/views/serviceNameAndDescription", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layoutNew.ejs",
    currentPage: "services",
    backLink: true,
    validationMessages: {},
  });
};

module.exports = getServiceNameAndDescription;
