jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory({
    support: {
      type: "api",
      service: {
        url: "http://support.test",
      },
    },
    access: {
      identifiers: {
        departmentForEducation: "departmentForEducation1",
        manageService: "manageService1",
      },
    },
  }),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("login.dfe.api-client/services", () => ({
  createServiceRaw: jest.fn(),
  createServiceRole: jest.fn(),
}));

const logger = require("./../../../src/infrastructure/logger");

const { getRequestMock, getResponseMock } = require("../../utils");
const {
  createServiceRaw,
  createServiceRole,
} = require("login.dfe.api-client/services");
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
    createServiceRole.mockReset().mockReturnValue({});
  });

  it("should redirect to /users on success", async () => {
    createServiceRaw.mockResolvedValue({ id: "new-service-id" });

    await postConfirmNewService(req, res);
    const [firstCall, secondCall, thirdCall] = createServiceRole.mock.calls;

    expect(createServiceRaw).toHaveBeenCalledTimes(1);
    expect(createServiceRole).toHaveBeenCalledTimes(3);

    expect(firstCall[0].appId).toEqual("manageService1");
    expect(firstCall[0].roleName).toEqual("newServiceName - Service Support");
    expect(firstCall[0].roleCode.split("_")).toContain("serviceSup");

    expect(secondCall[0].appId).toEqual("manageService1");
    expect(secondCall[0].roleName).toEqual("newServiceName - Service Banner");
    expect(secondCall[0].roleCode.split("_")).toContain("serviceBanner");

    expect(thirdCall[0].appId).toEqual("manageService1");
    expect(thirdCall[0].roleName).toEqual(
      "newServiceName - Service Configuration",
    );
    expect(thirdCall[0].roleCode.split("_")).toContain("serviceconfig");

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

  it('should log and flash an error if "Service Support" role creation fails', async () => {
    createServiceRaw.mockResolvedValue({ id: "new-service-id" });
    createServiceRole
      .mockRejectedValueOnce(new Error("Failed to create support role")) // first call fails
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    await postConfirmNewService(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create "Service Support" role'),
      expect.any(Object),
    );
    expect(res.flash).toHaveBeenCalledWith(
      "error",
      expect.stringContaining(
        "service successfully created but not all the manage console roles were created",
      ),
    );
    expect(res.redirect).toHaveBeenCalledWith("/users");
  });

  it('should log and flash an error if "Service Banner" role creation fails', async () => {
    createServiceRaw.mockResolvedValue({ id: "new-service-id" });
    createServiceRole
      .mockResolvedValueOnce({}) // support succeeds
      .mockRejectedValueOnce(new Error("Banner failed")) // banner fails
      .mockResolvedValueOnce({}); // config succeeds

    await postConfirmNewService(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create "Service Banner" role'),
      expect.any(Object),
    );
    expect(res.flash).toHaveBeenCalledWith(
      "error",
      expect.stringContaining(
        "service successfully created but not all the manage console roles were created",
      ),
    );
    expect(res.redirect).toHaveBeenCalledWith("/users");
  });

  it('should log and flash an error if "Service Configuration" role creation fails', async () => {
    createServiceRaw.mockResolvedValue({ id: "new-service-id" });
    createServiceRole
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Config failed"));

    await postConfirmNewService(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create "Service Configuration" role'),
      expect.any(Object),
    );
    expect(res.flash).toHaveBeenCalledWith(
      "error",
      expect.stringContaining(
        "service successfully created but not all the manage console roles were created",
      ),
    );
    expect(res.redirect).toHaveBeenCalledWith("/users");
  });

  it("should still redirect even if multiple role creations fail", async () => {
    createServiceRaw.mockResolvedValue({ id: "new-service-id" });
    createServiceRole.mockRejectedValue(new Error("All roles failed"));

    await postConfirmNewService(req, res);

    expect(res.flash).toHaveBeenCalledWith(
      "error",
      expect.stringContaining(
        "service successfully created but not all the manage console roles were created",
      ),
    );
    expect(res.redirect).toHaveBeenCalledWith("/users");
  });

  it("should redirect back to /users if nothing is in the session", async () => {
    req.session = {};

    await postConfirmNewService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });
});
