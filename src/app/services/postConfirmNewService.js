const logger = require("../../infrastructure/logger");
const config = require("../../infrastructure/config");
const {
  createServiceRaw,
  createServiceRole,
} = require("login.dfe.api-client/services");
const { encrypt } = require("login.dfe.api-client/encryption");

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

  // Hardcode the most common params for each service type.  An iteration
  // on this feature would add a page to add/change these default paramaters
  // during service creation.
  let params = {};
  if (model.serviceType === "standardServiceType") {
    params = {
      minimumRolesRequired: 1,
    };
  } else {
    params = {
      hideApprover: true,
      hideSupport: true,
      helpHidden: model.hideFromContactUs === undefined ? false : true,
    };
  }

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

  const isIdOnlyService =
    model.serviceType === "standardServiceType" ? false : true;
  const body = {
    name: model.name,
    description: model.description,
    isExternalService: false,
    isIdOnlyService,
    isHiddenService: model.hideFromUserServices === undefined ? false : true,
    isChildService: false,
    parentId: undefined,
    relyingParty: {
      clientId: model.clientId,
      clientSecret:
        model.clientSecret === "" ? "regenerate__me!" : model.clientSecret,
      apiSecret: model.apiSecret ? encrypt(model.apiSecret) : model.apiSecret,
      tokenEndpointAuthMethod: tokenEndpointAuthenticationMethod,
      serviceHome: model.homeUrl,
      postResetUrl: model.postPasswordResetUrl,
      redirectUris: model.service.redirectUris,
      postLogoutRedirectUris: model.service.postLogoutRedirectUris,
      grantTypes: grantTypes,
      responseTypes: responseTypes,
      params,
    },
  };

  let createdService;
  try {
    createdService = await createServiceRaw(body);

    if (!createdService || !createdService.id) {
      logger.error("Service creation failed — no service ID returned", {
        serviceBody: body,
      });
      res.flash(
        "error",
        `Failed to create the ${model.name} service. Please try again.`,
      );
      return res.redirect("/users");
    }
  } catch (error) {
    logger.error(`Error creating new service: ${model.name}`, { error });
    res.flash(
      "error",
      `An error occurred while creating the ${model.name} service.`,
    );
    return res.redirect("/users");
  }

  // We're intentionally not redirecting after an error, like we did for the service creation.
  // If an error occurs when creating roles, we want as much of the service set up
  // correctly as possible to reduce the amount of manual work that a fix would take
  const newServiceId = createdService.id;
  const manageServiceId = config.access.identifiers.manageService;

  try {
    await createServiceRole({
      appId: manageServiceId,
      roleName: `${model.name} - Service Support`,
      roleCode: `${newServiceId}_serviceSup`,
    });
  } catch (error) {
    logger.error(
      `Failed to create "Service Support" role for service ${model.name} (${newServiceId})`,
      { error },
    );
    res.flash(
      "error",
      `${model.name} service successfully created but not all the manage console roles were created.  Please investigate`,
    );
  }

  try {
    await createServiceRole({
      appId: manageServiceId,
      roleName: `${model.name} - Service Banner`,
      roleCode: `${newServiceId}_serviceBanner`,
    });
  } catch (error) {
    logger.error(
      `Failed to create "Service Banner" role for service ${model.name} (${newServiceId})`,
      { error },
    );
    res.flash(
      "error",
      `${model.name} service successfully created but not all the manage console roles were created.  Please investigate`,
    );
  }

  try {
    await createServiceRole({
      appId: manageServiceId,
      roleName: `${model.name} - Service Configuration`,
      roleCode: `${newServiceId}_serviceconfig`,
    });
  } catch (error) {
    logger.error(
      `Failed to create "Service Configuration" role for service ${model.name} (${newServiceId})`,
      { error },
    );
    res.flash(
      "error",
      `${model.name} service successfully created but not all the manage console roles were created.  Please investigate`,
    );
  }

  if (model.serviceType === "standardServiceType") {
    try {
      await createServiceRole({
        appId: manageServiceId,
        roleName: `${model.name} - Service Access Management`,
        roleCode: `${newServiceId}_accessManage`,
      });
    } catch (error) {
      logger.error(
        `Failed to create "Service Access Management" role for service ${model.name} (${newServiceId})`,
        { error },
      );
      res.flash(
        "error",
        `${model.name} service successfully created but not all the manage console roles were created.  Please investigate`,
      );
    }
  }

  logger.audit(`${req.user.email} created '${model.name}' service`, {
    type: "support",
    subType: "service-create",
    userId: req.user.sub,
    userEmail: req.user.email,
    client: model.clientId,
    name: model.name,
  });

  res.flash("info", `${model.name} service successfully created`);
  req.session.createServiceData = undefined;

  return res.redirect("/users");
};

module.exports = postConfirmNewService;
