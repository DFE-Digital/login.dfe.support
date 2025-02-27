const { sendResult } = require("../../infrastructure/utils");
const logger = require("../../infrastructure/logger");
const { getAllServices } = require("../../infrastructure/applications/api");

const validateInput = async (req) => {
  const model = {
    homeUrl: req.body.homeUrl || "",
    postPasswordResetUrl: req.body.postPasswordResetUrl || "",
    clientId: req.body.clientId || "",
    service: {
      redirectUris: [],
      postLogoutRedirectUris: [],
    },
    responseTypesCode: req.body["response_types-code"] || "",
    responseTypesIdToken: req.body["response_types-id_token"] || "",
    responseTypesToken: req.body["response_types-token"] || "",
    refreshToken: req.body.refreshToken || "",
    clientSecret: req.body.clientSecret || "",
    tokenEndpointAuthenticationMethod:
      req.body.tokenEndpointAuthenticationMethod,
    apiSecret: req.body.apiSecret || "",
    validationMessages: {},
  };

  // redirect_uris and post_logout_redirect_uris values are sometimes an array, sometimes a string and sometimes undefined.
  // Making sure that these values are always in an array saves us having to constantly check that later down the line.
  if (req.body.redirect_uris) {
    model.service.redirectUris = Array.isArray(req.body.redirect_uris)
      ? req.body.redirect_uris
      : [req.body.redirect_uris];
  }

  if (req.body.post_logout_redirect_uris) {
    model.service.postLogoutRedirectUris = Array.isArray(
      req.body.post_logout_redirect_uris,
    )
      ? req.body.post_logout_redirect_uris
      : [req.body.post_logout_redirect_uris];
  }

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

  // Redirect url validation
  if (
    !model.service.redirectUris ||
    model.service.redirectUris.length === 0 ||
    (model.service.redirectUris.length === 1 && !model.service.redirectUris[0])
  ) {
    model.validationMessages.redirect_uris = "Enter a redirect url";
  } else {
    await Promise.all(
      model.service.redirectUris.map(async (url) => {
        if (url.length > 1024) {
          if (
            model.validationMessages.redirect_uris !== "" &&
            model.validationMessages.redirect_uris !== undefined
          ) {
            model.validationMessages.redirect_uris +=
              "<br/>Redirect url must be 1024 characters or less";
          } else {
            model.validationMessages.redirect_uris =
              "Redirect url must be 1024 characters or less";
          }
        }
        try {
          new URL(url);
        } catch {
          if (
            model.validationMessages.redirect_uris !== "" &&
            model.validationMessages.redirect_uris !== undefined
          ) {
            model.validationMessages.redirect_uris +=
              "<br/>Redirect url must be a valid url";
          } else {
            model.validationMessages.redirect_uris =
              "Redirect url must be a valid url";
          }
        }
      }),
    );
  }
  if (
    model.service.redirectUris.some(
      (value, i) => model.service.redirectUris.indexOf(value) !== i,
    )
  ) {
    model.validationMessages.redirect_uris = "Redirect urls must all be unique";
  }

  // Logout urls validation
  if (
    !model.service.postLogoutRedirectUris ||
    model.service.postLogoutRedirectUris.length === 0 ||
    (model.service.postLogoutRedirectUris.length === 1 &&
      !model.service.postLogoutRedirectUris[0])
  ) {
    model.validationMessages.post_logout_redirect_uris =
      "Enter a log out redirect url";
  } else {
    await Promise.all(
      model.service.postLogoutRedirectUris.map(async (url) => {
        if (url.length > 1024) {
          if (
            model.validationMessages.post_logout_redirect_uris !== "" &&
            model.validationMessages.post_logout_redirect_uris !== undefined
          ) {
            model.validationMessages.post_logout_redirect_uris +=
              "<br/>Log out redirect url must be 1024 characters or less";
          } else {
            model.validationMessages.post_logout_redirect_uris =
              "Log out redirect url must be 1024 characters or less";
          }
        }
        try {
          new URL(url);
        } catch {
          if (
            model.validationMessages.post_logout_redirect_uris !== "" &&
            model.validationMessages.post_logout_redirect_uris !== undefined
          ) {
            model.validationMessages.post_logout_redirect_uris +=
              "<br/>Log out redirect url must be a valid url";
          } else {
            model.validationMessages.post_logout_redirect_uris =
              "Log out redirect url must be a valid url";
          }
        }
      }),
    );
    if (
      model.service.postLogoutRedirectUris.some(
        (value, i) => model.service.postLogoutRedirectUris.indexOf(value) !== i,
      )
    ) {
      model.validationMessages.post_logout_redirect_uris =
        "Redirect urls must all be unique";
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
