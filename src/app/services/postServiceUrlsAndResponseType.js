const { sendResult } = require("../../infrastructure/utils");
const logger = require("../../infrastructure/logger");

const validateInput = async (req) => {
  const model = {
    homeUrl: req.body.homeUrl || "",
    postPasswordResetUrl: req.body.postPasswordResetUrl || "",
    clientId: req.body.clientId || "",
    redirectUrl: req.body.redirectUrl || "",
    clientSecret: req.body.clientSecret || "",
    apiSecret: req.body.apiSecret || "",
    validationMessages: {},
  };

  if (!model.postPasswordResetUrl) {
    model.validationMessages.postPasswordResetUrl = "Enter a description";
  } else if (model.postPasswordResetUrl.length > 200) {
    model.validationMessages.postPasswordResetUrl =
      "Description must be 200 characters or less";
  }

  if (!model.homeUrl) {
    model.validationMessages.homeUrl = "Enter a name";
  } else if (model.homeUrl.length > 200) {
    model.validationMessages.homeUrl = "Name must be 200 characters or less";
  }

  if (!model.clientId) {
    model.validationMessages.clientId = "Enter a name";
  } else if (model.clientId.length > 200) {
    model.validationMessages.clientId = "Name must be 200 characters or less";
  }

  if (!model.redirectUrl) {
    model.validationMessages.redirectUrl = "Enter a name";
  } else if (model.redirectUrl.length > 200) {
    model.validationMessages.redirectUrl =
      "Name must be 200 characters or less";
  }

  if (!model.clientSecret) {
    model.validationMessages.clientSecret = "Enter a name";
  } else if (model.clientSecret.length > 200) {
    model.validationMessages.clientSecret =
      "Name must be 200 characters or less";
  }

  if (!model.apiSecret) {
    model.validationMessages.apiSecret = "Enter a name";
  } else if (model.apiSecret.length > 200) {
    model.validationMessages.apiSecret = "Name must be 200 characters or less";
  }

  return model;
};

const postServiceUrlsAndResponseType = async (req, res) => {
  const model = await validateInput(req);

  if (Object.keys(model.validationMessages).length > 0) {
    model.csrfToken = req.csrfToken();
    model.currentPage = "services";
    model.layout = "sharedViews/layoutNew.ejs";
    model.backLink = true;
    return sendResult(
      req,
      res,
      "services/views/serviceUrlsAndResponseType",
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
      model.validationMessages.homeUrl =
        "Something went wrong submitting data, please try again";
      model.csrfToken = req.csrfToken();
      model.currentPage = "services";
      model.layout = "sharedViews/layoutNew.ejs";
      model.backLink = true;
      return sendResult(
        req,
        res,
        "services/views/serviceUrlsAndResponseType",
        model,
      );
    }
    return res.redirect("/users");
  });
};

module.exports = postServiceUrlsAndResponseType;
