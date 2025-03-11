jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("./../../../src/infrastructure/applications");

const { getRequestMock, getResponseMock } = require("../../utils");
const { createService } = require("../../../src/infrastructure/applications");
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

    createService.mockReset().mockReturnValue({});
  });

  it("should redirect to /users on success", async () => {
    await postConfirmNewService(req, res);

    expect(createService.mock.calls).toHaveLength(1);
    expect(createService.mock.calls[0][0]).toStrictEqual({
      description: "newServiceDescription blah",
      isChildService: false,
      isIdOnlyService: true,
      isExternalService: false,
      name: "newServiceName",
      parentId: undefined,
      relyingParty: {
        api_secret: "this.is.an.api.secret",
        client_id: "TestClientId",
        client_secret: "this.is.a.client.secret",
        grant_types: ["authorization_code", "refresh_token"],
        params: {
          helpHidden: true,
          hideApprover: true,
          hideSupport: true,
        },
        postResetUrl: "https://postPasswordReseturl.com",
        post_logout_redirect_uris: ["https://logout-uri.com"],
        redirect_uris: ["https://redirect-uri.com"],
        response_types: ["code", "id_token", "token"],
        service_home: "https://homeUrl.com",
        token_endpoint_auth_method: "client_secret_post",
      },
    });
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
    expect(res.flash.mock.calls).toHaveLength(1);
    expect(req.session.createServiceData).toBe(undefined);
  });

  it("should not have refresh_token in grant types if not present", async () => {
    req.session.createServiceData.refreshToken = "";
    await postConfirmNewService(req, res);

    expect(createService.mock.calls).toHaveLength(1);
    expect(
      createService.mock.calls[0][0].relyingParty.grant_types,
    ).toStrictEqual(["authorization_code"]);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should have an undefined tokenEndpointAuthenticationMethod if client_secret_basic", async () => {
    req.session.createServiceData.tokenEndpointAuthenticationMethod =
      "client_secret_basic";
    await postConfirmNewService(req, res);

    expect(createService.mock.calls).toHaveLength(1);
    expect(
      createService.mock.calls[0][0].relyingParty.token_endpoint_auth_method,
    ).toBe(undefined);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should have an unchanged tokenEndpointAuthenticationMethod if client_secret_post", async () => {
    req.session.createServiceData.tokenEndpointAuthenticationMethod =
      "client_secret_post";
    await postConfirmNewService(req, res);

    expect(createService.mock.calls).toHaveLength(1);
    expect(
      createService.mock.calls[0][0].relyingParty.token_endpoint_auth_method,
    ).toBe("client_secret_post");
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should not have responseTypesCode in response types if not present", async () => {
    req.session.createServiceData.responseTypesCode = "";
    await postConfirmNewService(req, res);

    expect(createService.mock.calls).toHaveLength(1);
    expect(
      createService.mock.calls[0][0].relyingParty.response_types,
    ).toStrictEqual(["id_token", "token"]);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should not have responseTypesIdToken in response types if not present", async () => {
    req.session.createServiceData.responseTypesIdToken = "";
    await postConfirmNewService(req, res);

    expect(createService.mock.calls).toHaveLength(1);
    expect(
      createService.mock.calls[0][0].relyingParty.response_types,
    ).toStrictEqual(["code", "token"]);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("should not have responseTypesToken in response types if not present", async () => {
    req.session.createServiceData.responseTypesToken = "";
    await postConfirmNewService(req, res);

    expect(createService.mock.calls).toHaveLength(1);
    expect(
      createService.mock.calls[0][0].relyingParty.response_types,
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
