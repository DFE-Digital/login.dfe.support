const logger = require("../../infrastructure/logger");
const { createService } = require("./../../infrastructure/applications");

const postConfirmNewService = async (req, res) => {
  if (!req.session.createServiceData) {
    return res.redirect("/users");
  }

  const model = req.session.createServiceData;

  const responseTypes = [];
  if (model.responseTypesCode !== "") {
    responseTypes.push(model.responseTypesCode);
  }
  if (model.responseTypesIdToken !== "") {
    responseTypes.push(model.responseTypesIdToken);
  }
  if (model.responseTypesToken !== "") {
    responseTypes.push(model.responseTypesToken);
  }

  // Hardcode hideApprover, hideSupport and helpHidden to reflect id only service
  // This will need to be updated once we offer standard services
  const params = {
    hideApprover: true,
    hideSupport: true,
    helpHidden: model.hideFromContactUs === undefined ? false : true,
  };

  const grantTypes = [];
  grantTypes.push("authorization_code");
  if (model.refreshToken) {
    grantTypes.push("refresh_token");
  }

  // In the database the only 2 values for this are NULL and client_secret_post.  This
  // line keeps that true.
  let tokenEndpointAuthenticationMethod =
    model.tokenEndpointAuthenticationMethod;
  if (model.tokenEndpointAuthenticationMethod !== "client_secret_post") {
    tokenEndpointAuthenticationMethod = undefined;
  }

  // Hardcoding isIdOnlyService for now until we offer the ability to make a
  // standard service via the UI
  const body = {
    name: model.name,
    description: model.description,
    isExternalService: false,
    isIdOnlyService: true,
    isHiddenService: model.hideFromUserServices === undefined ? false : true,
    isChildService: false,
    parentId: undefined,
    relyingParty: {
      client_id: model.clientId,
      client_secret: model.clientSecret,
      api_secret: model.apiSecret,
      token_endpoint_auth_method: tokenEndpointAuthenticationMethod,
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
