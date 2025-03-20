const { sendResult } = require("../../infrastructure/utils");

const getServiceNameAndDescription = async (req, res) => {
  if (!req.session.createServiceData) {
    return res.redirect("/users");
  }

  const model = req.session.createServiceData;

  sendResult(req, res, "services/views/serviceNameAndDescription", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layoutNew.ejs",
    currentPage: "services",
    backLink: true,
    cancelLink: "/users",
    validationMessages: {},
    name: model.name,
    description: model.description,
  });
};

module.exports = getServiceNameAndDescription;
