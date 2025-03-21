const { sendResult } = require("../../infrastructure/utils");

const getServiceUrlsAndResponseType = async (req, res) => {
  if (!req.session.createServiceData) {
    return res.redirect("/users");
  }

  const model = req.session.createServiceData;

  sendResult(req, res, "services/views/serviceUrlsAndResponseType", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layoutNew.ejs",
    currentPage: "services",
    backLink: true,
    cancelLink: "/users",
    validationMessages: {},
    homeUrl: model.homeUrl,
    postPasswordResetUrl: model.postPasswordResetUrl,
    clientId: model.clientId,
    service: {
      redirectUris: model.service ? model.service.redirectUris : [],
      postLogoutRedirectUris: model.service
        ? model.service.postLogoutRedirectUris
        : [],
    },
    responseTypesCode: model.responseTypesCode,
    responseTypesIdToken: model.responseTypesIdToken,
    responseTypesToken: model.responseTypesToken,
    refreshToken: model.refreshToken,
    clientSecret: model.clientSecret,
    tokenEndpointAuthenticationMethod: model.tokenEndpointAuthenticationMethod,
    apiSecret: model.apiSecret,
  });
};

module.exports = getServiceUrlsAndResponseType;
