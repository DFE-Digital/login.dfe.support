const { sendResult } = require("./../../infrastructure/utils");

const getConfirmReactivate = async (req, res) => {
  sendResult(req, res, "users/views/confirmReactivate", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layoutNew.ejs",
    backLink: "services",
  });
};

module.exports = getConfirmReactivate;
