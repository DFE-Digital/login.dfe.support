const { sendResult } = require("../../infrastructure/utils");
const logger = require("../../infrastructure/logger");

const validateInput = (req) => {
  const model = {
    serviceType: req.body.serviceType,
    hideFromUserServices: req.body.hideFromUserServices,
    hideFromContactUs: req.body.hideFromContactUs,
    validationMessages: {},
  };

  if (!model.serviceType) {
    model.validationMessages.serviceType = "A service type must be selected";
  }

  if (model.serviceType === "standardServiceType") {
    model.validationMessages.serviceType =
      "The standard service type is not available yet. Only ID-only services can be created";
  }

  return model;
};

const postChooseServiceType = async (req, res) => {
  const model = validateInput(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    model.currentPage = "services";
    model.layout = "sharedViews/layoutNew.ejs";
    model.backLink = true;
    model.cancelLink = "/users";
    return sendResult(req, res, "services/views/chooseServiceType", model);
  }

  req.session.createServiceData = model;
  req.session.save((error) => {
    if (error) {
      // Any error saving to session should hopefully be temporary. Assuming this, we log the error
      // and just display an error message saying to try again.
      logger.error("An error occurred when saving to the session", error);
      model.validationMessages.serviceType =
        "Something went wrong submitting data, please try again";
      model.csrfToken = req.csrfToken();
      model.currentPage = "services";
      model.layout = "sharedViews/layoutNew.ejs";
      model.backLink = true;
      model.cancelLink = "/users";
      return sendResult(req, res, "services/views/chooseServiceType", model);
    }
    return res.redirect("/services/service-name-and-description");
  });
};

module.exports = postChooseServiceType;
