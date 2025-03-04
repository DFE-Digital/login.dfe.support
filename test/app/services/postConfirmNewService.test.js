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
          responseTypesCode: "responseTypesCode",
          responseTypesIdToken: "responseTypesIdToken",
          responseTypesToken: "responseTypesToken",
          refreshToken: "",
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
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
    expect(res.flash.mock.calls).toHaveLength(1);
    expect(req.session.createServiceData).toBe(undefined);
  });

  it.skip("should redirect back to /users if nothing is in the session", async () => {
    req.session = {};

    await postConfirmNewService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });
});
