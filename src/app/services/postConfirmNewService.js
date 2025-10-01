const logger = require("../../infrastructure/logger");
const { createServiceRaw } = require("login.dfe.api-client/services");

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

  // authorization_code if code is selected.
  // implicit if id_token, token, or id_token AND token are selected.
  const grantTypes = [];
  if (model.responseTypesCode) {
    grantTypes.push("authorization_code");
  }
  if (model.responseTypesToken || model.responseTypesIdToken) {
    grantTypes.push("implicit");
  }
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
      clientId: model.clientId,
      clientSecret: model.clientSecret,
      apiSecret: model.apiSecret,
      tokenEndpointAuthMethod: tokenEndpointAuthenticationMethod,
      serviceHome: model.homeUrl,
      postResetUrl: model.postPasswordResetUrl,
      redirectUris: model.service.redirectUris,
      postLogoutRedirectUris: model.service.postLogoutRedirectUris,
      grantTypes: grantTypes,
      responseTypes: responseTypes,
      params: params,
    },
  };

  await createServiceRaw(body);

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
