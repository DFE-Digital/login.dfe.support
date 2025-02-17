const { sendResult } = require("../../infrastructure/utils");
const logger = require("../../infrastructure/logger");
const { getAllServices } = require("../../infrastructure/applications/api");

const validateInput = async (req) => {
  const model = {
    name: req.body.name || "",
    description: req.body.description || "",
    validationMessages: {},
  };

  if (!model.name) {
    model.validationMessages.name = "Enter a name";
  } else if (model.name.length > 200) {
    model.validationMessages.name = "Name must be 200 characters or less";
  } else {
    const allServices = await getAllServices();
    const isMatchingName = allServices.services.find(
      (service) => service.name === model.name,
    );
    if (isMatchingName) {
      model.validationMessages.name =
        "Service name must be unique and cannot already exist in DfE Sign-in";
    }
  }

  if (!model.description) {
    model.validationMessages.description = "Enter a description";
  } else if (model.description.length > 200) {
    model.validationMessages.description =
      "Description must be 200 characters or less";
  }

  return model;
};

const postServiceNameAndDescription = async (req, res) => {
  const model = await validateInput(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    model.currentPage = "services";
    model.layout = "sharedViews/layoutNew.ejs";
    model.backLink = true;
    return sendResult(
      req,
      res,
      "services/views/serviceNameAndDescription",
      model,
    );
  }

  const createServiceData = req.session.createServiceData;
  Object.assign(createServiceData, model);
  req.session.createServiceData = createServiceData;
  req.session.save((error) => {
    if (error) {
      // Any error saving to session should hopefully be temporary. Assuming this, we log the error
      // and just display an error message saying to try again.
      logger.error("An error occurred when saving to the session", error);
      model.validationMessages.name =
        "Something went wrong submitting data, please try again";
      model.csrfToken = req.csrfToken();
      model.currentPage = "services";
      model.layout = "sharedViews/layoutNew.ejs";
      model.backLink = true;
      return sendResult(
        req,
        res,
        "services/views/serviceNameAndDescription",
        model,
      );
    }
    return res.redirect("/service-urls-and-response-type");
  });
};

module.exports = postServiceNameAndDescription;
