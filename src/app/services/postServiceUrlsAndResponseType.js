const { sendResult } = require("../../infrastructure/utils");
const { URL } = require("url");
const logger = require("../../infrastructure/logger");
const { getAllServices } = require("../../infrastructure/applications/api");

/**
 * Determines if the url has an http: or https: protocol
 *
 * @param {URL} url A URL object
 * @returns true if the protocol is http: or https:.  false otherwise.
 */
const isCorrectProtocol = (url) => {
  if (url && url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }
  return true;
};

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
    refreshToken: req.body.refreshToken,
    clientSecret: req.body.clientSecret || "",
    tokenEndpointAuthenticationMethod:
      req.body.tokenEndpointAuthenticationMethod,
    apiSecret: req.body.apiSecret || "",
    validationMessages: {},
  };

  // If code response type is NOT selected then silently discard these 3 values.
  if (!model.responseTypesCode) {
    model.refreshToken = undefined;
    model.clientSecret = "";
    model.tokenEndpointAuthenticationMethod = undefined;
  }

  // redirect_uris and post_logout_redirect_uris values are an array if multiple values entered,
  // a string if one value entered and undefined when nothing entered.
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

  // Post password reset url validation
  if (!model.postPasswordResetUrl) {
    model.validationMessages.postPasswordResetUrl =
      "Enter a post password reset url";
  } else if (model.postPasswordResetUrl.length > 200) {
    model.validationMessages.postPasswordResetUrl =
      "Post password reset url must be 200 characters or less";
  } else {
    try {
      const postPasswordResetUrl = new URL(model.postPasswordResetUrl);
      if (!isCorrectProtocol(postPasswordResetUrl)) {
        model.validationMessages.postPasswordResetUrl =
          "Post password reset url protocol can only be http or https";
      }
    } catch {
      model.validationMessages.postPasswordResetUrl =
        "Post password reset url must be a valid url";
    }
  }

  // Home url validation
  if (!model.homeUrl) {
    model.validationMessages.homeUrl = "Enter a home url";
  } else if (model.homeUrl.length > 200) {
    model.validationMessages.homeUrl =
      "Home url must be 200 characters or less";
  } else {
    try {
      const homeUrl = new URL(model.homeUrl);
      if (!isCorrectProtocol(homeUrl)) {
        model.validationMessages.homeUrl =
          "Home url protocol can only be http or https";
      }
    } catch {
      model.validationMessages.homeUrl = "Home url must be a valid url";
    }
  }

  if (!model.clientId) {
    model.validationMessages.clientId = "Enter a client id";
  } else if (model.clientId.length > 50) {
    model.validationMessages.clientId =
      "Client id must be 50 characters or less";
  } else if (!/^[A-Za-z0-9-]+$/.test(model.clientId)) {
    model.validationMessages.clientId =
      "Client ID must only contain letters a to z, hyphens and numbers";
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
  const redirectUris = model.service.redirectUris;
  const areRedirectUrisNotPopulated =
    !redirectUris ||
    redirectUris.length === 0 ||
    (redirectUris.length === 1 && !redirectUris[0]);

  if (areRedirectUrisNotPopulated) {
    model.validationMessages.redirect_uris = "Enter a redirect url";
  } else {
    await Promise.all(
      redirectUris.map(async (url) => {
        if (url.length > 200) {
          if (model.validationMessages.redirect_uris !== undefined) {
            model.validationMessages.redirect_uris +=
              "<br/>Redirect url must be 200 characters or less";
          } else {
            model.validationMessages.redirect_uris =
              "Redirect url must be 200 characters or less";
          }
        }
        try {
          const redirectUri = new URL(url);
          if (!isCorrectProtocol(redirectUri)) {
            if (model.validationMessages.redirect_uris !== undefined) {
              model.validationMessages.redirect_uris +=
                "<br/>Redirect uri protocol can only be http or https";
            } else {
              model.validationMessages.redirect_uris =
                "Redirect uri protocol can only be http or https";
            }
          }
        } catch {
          if (model.validationMessages.redirect_uris !== undefined) {
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
  if (redirectUris.some((value, i) => redirectUris.indexOf(value) !== i)) {
    model.validationMessages.redirect_uris = "Redirect urls must all be unique";
  }

  // Logout redirect urls validation
  const logoutRedirectUris = model.service.postLogoutRedirectUris;
  if (!logoutRedirectUris || logoutRedirectUris.length === 0) {
    model.validationMessages.post_logout_redirect_uris =
      "Enter at least 1 logout redirect URL";
  } else {
    await Promise.all(
      logoutRedirectUris.map(async (url) => {
        if (url.length > 200) {
          if (
            model.validationMessages.post_logout_redirect_uris !== undefined
          ) {
            model.validationMessages.post_logout_redirect_uris +=
              "<br/>Log out redirect url must be 200 characters or less";
          } else {
            model.validationMessages.post_logout_redirect_uris =
              "Log out redirect url must be 200 characters or less";
          }
        }
        try {
          const postLogoutRedirectUrl = new URL(url);
          if (!isCorrectProtocol(postLogoutRedirectUrl)) {
            if (
              model.validationMessages.post_logout_redirect_uris !== undefined
            ) {
              model.validationMessages.post_logout_redirect_uris +=
                "<br/>Log out redirect url protocol can only be http or https";
            } else {
              model.validationMessages.post_logout_redirect_uris =
                "Log out redirect url protocol can only be http or https";
            }
          }
        } catch {
          if (
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
      logoutRedirectUris.some(
        (value, i) => logoutRedirectUris.indexOf(value) !== i,
      )
    ) {
      model.validationMessages.post_logout_redirect_uris =
        "Log out redirect urls must all be unique";
    }
  }

  // Response types validation
  if (
    !model.responseTypesCode &&
    !model.responseTypesToken &&
    !model.responseTypesIdToken
  ) {
    model.validationMessages.responseTypes = "Select at least 1 response type";
  }

  const isCodeOrIdTokenSelected =
    model.responseTypesCode || model.responseTypesIdToken;
  if (model.responseTypesToken && !isCodeOrIdTokenSelected) {
    model.validationMessages.responseTypesToken =
      "Select more than 1 response type when 'token' is selected as a response type";
  }

  if (model.responseTypesCode) {
    if (!model.clientSecret) {
      model.validationMessages.clientSecret = "Enter a client secret";
    } else if (model.clientSecret.length > 255) {
      model.validationMessages.clientSecret =
        "Client secret must be 255 characters or less";
    }
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
    model.layout = "sharedViews/layout.ejs";
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
      model.layout = "sharedViews/layout.ejs";
      model.backLink = true;
      model.cancelLink = "/users";
      return sendResult(
        req,
        res,
        "services/views/serviceUrlsAndResponseType",
        model,
      );
    }
    return res.redirect("confirm-new-service");
  });
};

module.exports = postServiceUrlsAndResponseType;
