const { sendResult } = require("../../infrastructure/utils");
const logger = require("../../infrastructure/logger");
const { getAllServices } = require("../../infrastructure/applications/api");

const validateInput = async (req) => {
  const model = {
    homeUrl: req.body.homeUrl || "",
    postPasswordResetUrl: req.body.postPasswordResetUrl || "",
    clientId: req.body.clientId || "",
    redirectUrl: req.body.redirectUrl || "",
    logOutRedirectUrl: req.body.logOutRedirectUrl || "",
    responseTypesCode: req.body.responseTypesCode || "",
    responseTypesIdToken: req.body.responseTypesIdToken || "",
    responseTypesToken: req.body.responseTypesToken || "",
    refreshToken: req.body.refreshToken || "",
    clientSecret: req.body.clientSecret || "",
    tokenEndpointAuthenticationMethod:
      req.body.tokenEndpointAuthenticationMethod,
    apiSecret: req.body.apiSecret || "",
    validationMessages: {},
  };

  if (!model.postPasswordResetUrl) {
    model.validationMessages.postPasswordResetUrl =
      "Enter a post password reset url";
  } else if (model.postPasswordResetUrl.length > 1024) {
    model.validationMessages.postPasswordResetUrl =
      "Post password reset url must be 1024 characters or less";
  } else {
    try {
      new URL(model.postPasswordResetUrl);
    } catch {
      model.validationMessages.postPasswordResetUrl =
        "Post password reset url must be a valid url";
    }
  }

  if (!model.homeUrl) {
    model.validationMessages.homeUrl = "Enter a home url";
  } else if (model.homeUrl.length > 1024) {
    model.validationMessages.homeUrl =
      "Home url must be 1024 characters or less";
  } else {
    try {
      new URL(model.homeUrl);
    } catch {
      model.validationMessages.homeUrl = "Home url must be a valid url";
    }
  }

  if (!model.clientId) {
    model.validationMessages.clientId = "Enter a client id";
  } else if (model.clientId.length > 50) {
    model.validationMessages.clientId =
      "Client id must be 50 characters or less";
  } else {
    const allServices = await getAllServices();
    const isMatchingClientId = allServices.services.find(
      (service) => service.clientId === model.clientId,
    );
    if (isMatchingClientId) {
      model.validationMessages.clientId =
        "Client Id must be unique and cannot already exist in DfE Sign-in";
    }
  }

  if (!model.redirectUrl) {
    model.validationMessages.redirectUrl = "Enter a redirect url";
  } else if (model.redirectUrl.length > 1024) {
    model.validationMessages.redirectUrl =
      "Redirect url must be 1024 characters or less";
  } else {
    try {
      new URL(model.redirectUrl);
    } catch {
      model.validationMessages.redirectUrl = "Redirect url must be a valid url";
    }
  }

  if (!model.logOutRedirectUrl) {
    model.validationMessages.logOutRedirectUrl = "Enter a log out redirect url";
  } else if (model.logOutRedirectUrl.length > 1024) {
    model.validationMessages.logOutRedirectUrl =
      "Log out redirect url must be 1024 characters or less";
  } else {
    try {
      new URL(model.logOutRedirectUrl);
    } catch {
      model.validationMessages.logOutRedirectUrl =
        "Log out redirect url must be a valid url";
    }
  }

  if (!model.clientSecret) {
    model.validationMessages.clientSecret = "Enter a client secret";
  } else if (model.clientSecret.length > 255) {
    model.validationMessages.clientSecret =
      "Client secret must be 255 characters or less";
  }

  if (!model.apiSecret) {
    model.validationMessages.apiSecret = "Enter an api secret";
  } else if (model.apiSecret.length > 255) {
    model.validationMessages.apiSecret =
      "Api secret must be 255 characters or less";
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
    model.cancelLink = "/users";
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
      model.cancelLink = "/users";
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
