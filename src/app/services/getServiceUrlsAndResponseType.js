const { sendResult } = require("../../infrastructure/utils");

const getServiceUrlsAndResponseType = async (req, res) => {
  sendResult(req, res, "services/views/serviceUrlsAndResponseType", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layoutNew.ejs",
    currentPage: "services",
    backLink: true,
    validationMessages: {},
  });
};

module.exports = getServiceUrlsAndResponseType;
