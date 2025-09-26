jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("login.dfe.api-client/services");
const { getRequestMock, getResponseMock } = require("../../utils");
const { createServiceRaw } = require("login.dfe.api-client/services");
const postConfirmNewService = require("../../../src/app/services/postConfirmNewService");

const res = getResponseMock();

describe("when displaying the post create new service", () => {
  let req;
  beforeEach(() => {
    req = getRequestMock({
      session: {
        createServiceData: {
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
          responseTypesCode: "code",
          responseTypesIdToken: "id_token",
          responseTypesToken: "token",
          refreshToken: "refresh_token",
          clientSecret: "this.is.a.client.secret",
          tokenEndpointAuthenticationMethod: "client_secret_post",
          apiSecret: "this.is.an.api.secret",
        },
      },
    });
    res.mockResetAll();

    createServiceRaw.mockReset().mockReturnValue({});
  });

  it("should redirect to /users on success", async () => {
    await postConfirmNewService(req, res);

    expect(createServiceRaw).toHaveBeenCalledTimes(1);
    expect(createServiceRaw.mock.calls[0][0]).toStrictEqual({
      description: "newServiceDescription blah",
      isChildService: false,
      isIdOnlyService: true,
      isHiddenService: false,
      isExternalService: false,
      name: "newServiceName",
      parentId: undefined,
      relyingParty: {
        apiSecret: "this.is.an.api.secret",
        clientId: "TestClientId",
        clientSecret: "this.is.a.client.secret",
        grantTypes: ["authorization_code", "implicit", "refresh_token"],
        params: {
          helpHidden: false,
          hideApprover: true,
          hideSupport: true,
        },
        postResetUrl: "https://postPasswordReseturl.com",
        postLogoutRedirectUris: ["https://logout-uri.com"],
        redirectUris: ["https://redirect-uri.com"],
        responseTypes: ["code", "id_token", "token"],
        serviceHome: "https://homeUrl.com",
        tokenEndpointAuthMethod: "client_secret_post",
      },
    });
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
    expect(res.flash.mock.calls).toHaveLength(1);
    expect(req.session.createServiceData).toBe(undefined);
  });

  it("should not have authorization_code in grant types if code not present", async () => {
    req.session.createServiceData.responseTypesCode = undefined;
    await postConfirmNewService(req, res);

    expect(createServiceRaw.mock.calls).toHaveLength(1);
    expect(
      createServiceRaw.mock.calls[0][0].relyingParty.grantTypes,
    ).toStrictEqual(["implicit", "refresh_token"]);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should not have implicit in grant types if token or idToken not present", async () => {
    req.session.createServiceData.responseTypesIdToken = undefined;
    req.session.createServiceData.responseTypesToken = undefined;
    await postConfirmNewService(req, res);

    expect(createServiceRaw.mock.calls).toHaveLength(1);
    expect(
      createServiceRaw.mock.calls[0][0].relyingParty.grantTypes,
    ).toStrictEqual(["authorization_code", "refresh_token"]);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should not have refresh_token in grant types if not present", async () => {
    req.session.createServiceData.refreshToken = "";
    await postConfirmNewService(req, res);

    expect(createServiceRaw.mock.calls).toHaveLength(1);
    expect(
      createServiceRaw.mock.calls[0][0].relyingParty.grantTypes,
    ).toStrictEqual(["authorization_code", "implicit"]);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should have helpHidden param be true if hideFromContactUs is defined", async () => {
    req.session.createServiceData.hideFromContactUs = "hideFromContactUs";
    await postConfirmNewService(req, res);

    expect(createServiceRaw.mock.calls).toHaveLength(1);
    expect(
      createServiceRaw.mock.calls[0][0].relyingParty.params.helpHidden,
    ).toBe(true);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should have isHiddenService be true if hideFromUserServices is defined", async () => {
    req.session.createServiceData.hideFromUserServices = "hideFromUserServices";
    await postConfirmNewService(req, res);

    expect(createServiceRaw.mock.calls).toHaveLength(1);
    expect(createServiceRaw.mock.calls[0][0].isHiddenService).toBe(true);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should have an undefined tokenEndpointAuthenticationMethod if client_secret_basic", async () => {
    req.session.createServiceData.tokenEndpointAuthenticationMethod =
      "client_secret_basic";
    await postConfirmNewService(req, res);

    expect(createServiceRaw.mock.calls).toHaveLength(1);
    expect(
      createServiceRaw.mock.calls[0][0].relyingParty.tokenEndpointAuthMethod,
    ).toBe(undefined);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should have an unchanged tokenEndpointAuthenticationMethod if client_secret_post", async () => {
    req.session.createServiceData.tokenEndpointAuthenticationMethod =
      "client_secret_post";
    await postConfirmNewService(req, res);

    expect(createServiceRaw.mock.calls).toHaveLength(1);
    expect(
      createServiceRaw.mock.calls[0][0].relyingParty.tokenEndpointAuthMethod,
    ).toBe("client_secret_post");
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should not have responseTypesCode in response types if not present", async () => {
    req.session.createServiceData.responseTypesCode = "";
    await postConfirmNewService(req, res);

    expect(createServiceRaw.mock.calls).toHaveLength(1);
    expect(
      createServiceRaw.mock.calls[0][0].relyingParty.responseTypes,
    ).toStrictEqual(["id_token", "token"]);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should not have responseTypesIdToken in response types if not present", async () => {
    req.session.createServiceData.responseTypesIdToken = "";
    await postConfirmNewService(req, res);

    expect(createServiceRaw.mock.calls).toHaveLength(1);
    expect(
      createServiceRaw.mock.calls[0][0].relyingParty.responseTypes,
    ).toStrictEqual(["code", "token"]);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should not have responseTypesToken in response types if not present", async () => {
    req.session.createServiceData.responseTypesToken = "";
    await postConfirmNewService(req, res);

    expect(createServiceRaw.mock.calls).toHaveLength(1);
    expect(
      createServiceRaw.mock.calls[0][0].relyingParty.responseTypes,
    ).toStrictEqual(["code", "id_token"]);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should redirect back to /users if nothing is in the session", async () => {
    req.session = {};

    await postConfirmNewService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });
});
