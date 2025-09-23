const { sendResult } = require("../../infrastructure/utils");

const getServiceNameAndDescription = async (req, res) => {
  if (!req.session.createServiceData) {
    return res.redirect("/users");
  }

  const model = req.session.createServiceData;

  sendResult(req, res, "services/views/confirmNewService", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layout.ejs",
    currentPage: "services",
    backLink: true,
    cancelLink: "/users",
    model,
    validationMessages: {},
  });
};

module.exports = getServiceNameAndDescription;
