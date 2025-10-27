const { sendResult } = require("./../../infrastructure/utils");

const getConfirmDeactivate = (req, res) => {
  sendResult(req, res, "users/views/confirmDeactivate", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layout.ejs",
    backLink: "services",
    currentPage: "users",
    reason: "",
    validationMessages: {},
  });
};

module.exports = getConfirmDeactivate;
