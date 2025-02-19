const { sendResult } = require("../../infrastructure/utils");

const getChooseServiceType = async (req, res) => {
  sendResult(req, res, "services/views/chooseServiceType", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layoutNew.ejs",
    currentPage: "services",
    backLink: true,
    cancelLink: "/users",
    validationMessages: {},
  });
};

module.exports = getChooseServiceType;
