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
    tokenEndpointAuthenticationMethod: "client_post",
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
  // TODO do hideFromUserServices and hideFromContactUs affect these values??
  // Are there any others that need to be set?  The database has a bunch of em
  const params = {
    hideApprover: true,
    hideSupport: true,
    helpHidden: true,
  };

  // TODO, what the heck are the grant types?! How many can we hard code and how many
  // can we use the existing forms to figure out.
  // Existing ones in the db are authorization_code, client_credentials, implicit and
  // refresh token.
  const grantTypes = [];
  if (model.refreshToken) {
    grantTypes.push(model.refreshToken);
  }

  const body = {
    service: {
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
    },
  };
  console.log(body);

  //await createService(body, req.id);

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
  req.session.editOrgFormData = undefined;

  // Flash success message
  // Clear variable in session

  return res.redirect("/users");
};

module.exports = postConfirmNewService;
