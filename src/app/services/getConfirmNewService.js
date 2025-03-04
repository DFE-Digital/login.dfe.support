const { sendResult } = require("../../infrastructure/utils");

const getServiceNameAndDescription = async (req, res) => {
  // if (!req.session.createServiceData) {
  //   return res.redirect("/users");
  // }

  //const model = req.session.createServiceData;
  // Temporarily set up the expected session data
  const model = {
    serviceType: "idOnly",
    hideFromUserServices: undefined,
    hideFromContactUs: undefined,
    name: "newServiceName",
    description: "newServiceDescription blah",
    homeUrl: "https://homeUrl.com",
    postPasswordResetUrl: "https://postPasswordReseturl.com",
    clientId: "TestClientId",
    service: {
      redirectUris: ["https://redirect-uri.com"],
      postLogoutRedirectUris: ["https://logout-uri.com"],
    },
    responseTypesCode: "responseTypesCode",
    responseTypesIdToken: "responseTypesIdToken",
    responseTypesToken: "responseTypesToken",
    refreshToken: "",
    clientSecret: "this.is.a.client.secret",
    tokenEndpointAuthenticationMethod: "client_secret_post",
    apiSecret: "this.is.an.api.secret",
  };

  sendResult(req, res, "services/views/confirmNewService", {
    csrfToken: req.csrfToken(),
    layout: "sharedViews/layoutNew.ejs",
    currentPage: "services",
    backLink: true,
    cancelLink: "/users",
    model,
    validationMessages: {},
  });
};

module.exports = getServiceNameAndDescription;
