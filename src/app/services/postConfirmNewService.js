const logger = require("../../infrastructure/logger");
const { createService } = require("./../../infrastructure/applications");

const postConfirmNewService = async (req, res) => {
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

  // TODO, modify previous page to write response types to session as an
  // array to save us having to do it here
  const responseTypes = [];
  if (model.responseTypesCode !== undefined) {
    responseTypes.push(model.responseTypesCode);
  }
  if (model.responseTypesIdToken !== undefined) {
    responseTypes.push(model.responseTypesIdToken);
  }
  if (model.responseTypesToken !== undefined) {
    responseTypes.push(model.responseTypesToken);
  }

  // Hardcode hideApprover, hideSupport and helpHidden to reflect id only service
  // This will need to be updated once we offer standard services
  const params = {
    hideApprover: true,
    hideSupport: true,
    helpHidden: true,
  };

  const grantTypes = [];
  grantTypes.push("authorization_code");
  if (model.refreshToken) {
    grantTypes.push("refresh_token");
  }

  const body = {
    name: model.name,
    description: model.description,
    isExternalService: false,
    isChildService: false,
    parentId: undefined,
    relyingParty: {
      client_id: model.clientId,
      client_secret: model.clientSecret,
      api_secret: model.apiSecret,
      token_endpoint_auth_method: model.tokenEndpointAuthenticationMethod,
      service_home: model.homeUrl,
      postResetUrl: model.postPasswordResetUrl,
      redirect_uris: model.service.redirectUris,
      post_logout_redirect_uris: model.service.postLogoutRedirectUris,
      grant_types: grantTypes,
      response_types: responseTypes,
      params: params,
    },
  };

  await createService(body, req.id);

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) created ${model.name} service`,
    {
      type: "support",
      subType: "service-create",
      userId: req.user.sub,
      userEmail: req.user.email,
      name: model.name,
    },
  );

  res.flash("info", `${model.name} service successfully created`);
  req.session.createServiceData = undefined;

  return res.redirect("/users");
};

module.exports = postConfirmNewService;
