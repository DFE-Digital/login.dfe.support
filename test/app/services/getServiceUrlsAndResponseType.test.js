jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");

const { getRequestMock, getResponseMock } = require("../../utils");
const { sendResult } = require("../../../src/infrastructure/utils");
const getServiceUrlsAndResponseType = require("../../../src/app/services/getServiceUrlsAndResponseType");

const res = getResponseMock();

describe("when displaying the get choose service type", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      session: {
        createServiceData: {
          serviceType: "idOnly",
          hideFromUserServices: undefined,
          hideFromContactUs: undefined,
          name: "test name",
          description: "Test service description",
        },
      },
    });
    res.mockResetAll();
  });

  it("should redirect back to /users if nothing is in the session", async () => {
    req.session = {};

    await getServiceUrlsAndResponseType(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
  });

  it("then it should return the get service urls and response type view", async () => {
    await getServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult).toHaveBeenCalledWith(
      req,
      res,
      "services/views/serviceUrlsAndResponseType",
      {
        csrfToken: req.csrfToken(),
        backLink: true,
        cancelLink: "/users",
        currentPage: "services",
        layout: "sharedViews/layoutNew.ejs",
        service: {
          postLogoutRedirectUris: [],
          redirectUris: [],
        },
        validationMessages: {},
      },
    );
  });

  it("then it should return the redirect urls if present in the session", async () => {
    ((req.session = {
      createServiceData: {
        serviceType: "idOnlyServiceType",
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
    }),
      await getServiceUrlsAndResponseType(req, res));

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult).toHaveBeenCalledWith(
      req,
      res,
      "services/views/serviceUrlsAndResponseType",
      {
        csrfToken: req.csrfToken(),
        backLink: true,
        cancelLink: "/users",
        currentPage: "services",
        layout: "sharedViews/layoutNew.ejs",
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
        validationMessages: {},
      },
    );
  });
});
