jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("./../../../src/infrastructure/applications/api");

const { getRequestMock, getResponseMock } = require("../../utils");
const { sendResult } = require("../../../src/infrastructure/utils");

const {
  getAllServices,
} = require("../../../src/infrastructure/applications/api");
const postServiceUrlsAndResponseType = require("../../../src/app/services/postServiceUrlsAndResponseType");

const res = getResponseMock();

describe("when displaying the post choose service type screen", () => {
  let req;
  let exampleErrorResponse;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        homeUrl: "https://test-url.com/home",
        postPasswordResetUrl: "https://test-url.com/post-password-reset",
        clientId: "test-client-id",
        redirect_uris: "https://test-url.com/redirect",
        post_logout_redirect_uris: "https://test-url.com/log-out-redirect",
        "response_types-code": "responseTypesCode",
        "response_types-id_token": "",
        "response_types-token": "",
        refreshToken: "refresh_token",
        clientSecret: "client-secret",
        apiSecret: "api-secret",
      },
      session: {
        createServiceData: {
          serviceType: "idOnlyServiceType",
          name: "Test name",
          description: "Test description",
        },
        save: jest.fn((cb) => cb()),
      },
    });
    res.mockResetAll();

    sendResult.mockReset();

    // More fields exist in a real response, reducing it here to keep things succinct
    const getAllServicesResponse = {
      services: [
        {
          id: "4A40415F-1A13-48F4-B54F-0AB0FC0A9AAC",
          name: "Existing service name",
          description: "Existing service description",
          clientId: "existing-client-id",
          isExternalService: true,
          isIdOnlyService: false,
        },
      ],
    };
    getAllServices.mockReset().mockReturnValue(getAllServicesResponse);

    // Example data that each error test can modify so it doens't need to be copied
    // again and again
    exampleErrorResponse = {
      homeUrl: "https://test-url.com/home",
      postPasswordResetUrl: "https://test-url.com/post-password-reset",
      clientId: "test-client-id",
      service: {
        postLogoutRedirectUris: ["https://test-url.com/log-out-redirect"],
        redirectUris: ["https://test-url.com/redirect"],
      },
      responseTypesCode: "responseTypesCode",
      responseTypesIdToken: "",
      responseTypesToken: "",
      refreshToken: "refresh_token",
      clientSecret: "client-secret",
      tokenEndpointAuthenticationMethod: undefined,
      apiSecret: "api-secret",
      validationMessages: {},
      csrfToken: "token",
      currentPage: "services",
      layout: "sharedViews/layoutNew.ejs",
      backLink: true,
      cancelLink: "/users",
    };
  });

  it("should redirect to the service urls and response type page on success", async () => {
    await postServiceUrlsAndResponseType(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-new-service");
    expect(sendResult).toHaveBeenCalledTimes(0);
  });

  it("should redirect to the service urls and response type page on success with multiple redirect and logout redirect urls", async () => {
    // If multiple are entered in the form, it gets sent as an array instead of a single value
    // This test makes sure the rest of the form handles the data in both forms correctly
    req.body.redirect_uris = [
      "https://test-url.com/redirect",
      "https://test-url2.com/redirect2",
    ];
    req.body.post_logout_redirect_uris = [
      "https://test-url.com/log-out-redirect",
      "https://test-url2.com/log-out-redirect2",
    ];

    await postServiceUrlsAndResponseType(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-new-service");
    expect(sendResult).toHaveBeenCalledTimes(0);
  });

  it("should discard client_secret, refresh_token and tokenEndpointAuthenticationMethod if response type code is not selected", async () => {
    req.body["response_types-code"] = "";
    req.body["response_types-id_token"] = "response_types-idToken";
    req.body.refreshToken = "refresh_token";
    req.body.clientSecret = "Test secret";
    req.body.tokenEndpointAuthenticationMethod =
      "tokenEndpointAuthenticationMethod";
    await postServiceUrlsAndResponseType(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("confirm-new-service");
    expect(req.session.createServiceData).toStrictEqual({
      serviceType: "idOnlyServiceType",
      name: "Test name",
      description: "Test description",
      homeUrl: "https://test-url.com/home",
      postPasswordResetUrl: "https://test-url.com/post-password-reset",
      clientId: "test-client-id",
      service: {
        postLogoutRedirectUris: ["https://test-url.com/log-out-redirect"],
        redirectUris: ["https://test-url.com/redirect"],
      },
      responseTypesCode: "",
      responseTypesIdToken: "response_types-idToken",
      responseTypesToken: "",
      refreshToken: undefined,
      clientSecret: "",
      tokenEndpointAuthenticationMethod: undefined,
      apiSecret: "api-secret",
      validationMessages: {},
    });
    expect(sendResult).toHaveBeenCalledTimes(0);
  });

  it("should render the page if there is an error saving to the session", async () => {
    req.session = {
      createServiceData: {
        serviceType: "idOnlyServiceType",
        name: "Test name",
        description: "Test description",
      },
      save: jest.fn((cb) => cb("Something went wrong")),
    };

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult).toHaveBeenCalledWith(
      req,
      res,
      "services/views/serviceUrlsAndResponseType",
      {
        homeUrl: "https://test-url.com/home",
        postPasswordResetUrl: "https://test-url.com/post-password-reset",
        clientId: "test-client-id",
        responseTypesCode: "responseTypesCode",
        responseTypesIdToken: "",
        responseTypesToken: "",
        service: {
          postLogoutRedirectUris: ["https://test-url.com/log-out-redirect"],
          redirectUris: ["https://test-url.com/redirect"],
        },
        refreshToken: "refresh_token",
        clientSecret: "client-secret",
        tokenEndpointAuthenticationMethod: undefined,
        apiSecret: "api-secret",
        csrfToken: req.csrfToken(),
        backLink: true,
        cancelLink: "/users",
        currentPage: "services",
        layout: "sharedViews/layoutNew.ejs",
        validationMessages: {
          homeUrl: "Something went wrong submitting data, please try again",
        },
      },
    );
  });

  it("should render an the page with an error in validationMessages if no postPasswordResetUrl is entered", async () => {
    req.body.postPasswordResetUrl = "";
    exampleErrorResponse.postPasswordResetUrl = "";
    exampleErrorResponse.validationMessages.postPasswordResetUrl =
      "Enter a post password reset url";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if no postPasswordResetUrl is entered", async () => {
    req.body.postPasswordResetUrl = "";
    exampleErrorResponse.postPasswordResetUrl = "";
    exampleErrorResponse.validationMessages.postPasswordResetUrl =
      "Enter a post password reset url";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if postPasswordResetUrl over 200 characters", async () => {
    req.body.postPasswordResetUrl =
      "https://" + "Test123456".repeat(30) + ".com"; // 300+ character length string
    exampleErrorResponse.postPasswordResetUrl =
      "https://" + "Test123456".repeat(30) + ".com"; // 300+ character length string
    exampleErrorResponse.validationMessages.postPasswordResetUrl =
      "Post password reset url must be 200 characters or less";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if an invalid postPasswordResetUrl is entered", async () => {
    req.body.postPasswordResetUrl = "anInvalidUrl@slbsh!!!$$%";
    exampleErrorResponse.postPasswordResetUrl = "anInvalidUrl@slbsh!!!$$%";
    exampleErrorResponse.validationMessages.postPasswordResetUrl =
      "Post password reset url must be a valid url";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if a postPasswordResetUrl with an invalid protocol is entered", async () => {
    req.body.postPasswordResetUrl = "ftp://a-valid-url.com/valid";
    exampleErrorResponse.postPasswordResetUrl = "ftp://a-valid-url.com/valid";
    exampleErrorResponse.validationMessages.postPasswordResetUrl =
      "Post password reset url protocol can only be http or https";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if no home url is entered", async () => {
    req.body.homeUrl = "";
    exampleErrorResponse.homeUrl = "";
    exampleErrorResponse.validationMessages.homeUrl = "Enter a home url";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if homeUrl over 1024 characters", async () => {
    req.body.homeUrl = "https://" + "Test123456".repeat(30) + ".com"; // 300+ character length string
    exampleErrorResponse.homeUrl =
      "https://" + "Test123456".repeat(30) + ".com"; // 300+ character length string
    exampleErrorResponse.validationMessages.homeUrl =
      "Home url must be 200 characters or less";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if an invalid homeUrl is entered", async () => {
    req.body.homeUrl = "anInvalidUrl@slbsh!$$%";
    exampleErrorResponse.homeUrl = "anInvalidUrl@slbsh!$$%";
    exampleErrorResponse.validationMessages.homeUrl =
      "Home url must be a valid url";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if a homeUrl with an invalid protocol is entered", async () => {
    req.body.homeUrl = "ftp://a-valid-url.com/valid";
    exampleErrorResponse.homeUrl = "ftp://a-valid-url.com/valid";
    exampleErrorResponse.validationMessages.homeUrl =
      "Home url protocol can only be http or https";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if no clientId is entered", async () => {
    req.body.clientId = "";
    exampleErrorResponse.clientId = "";
    exampleErrorResponse.validationMessages.clientId = "Enter a client id";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if clientId over 50 characters", async () => {
    req.body.clientId = "Test123456".repeat(6); // 60 character length string
    exampleErrorResponse.clientId = "Test123456".repeat(6); // 60 character length string
    exampleErrorResponse.validationMessages.clientId =
      "Client id must be 50 characters or less";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if clientId contains non-hypen and non-alphanumeric characters", async () => {
    req.body.clientId = "Test123!&^%*";
    exampleErrorResponse.clientId = "Test123!&^%*";
    exampleErrorResponse.validationMessages.clientId =
      "Client ID must only contain letters a to z, hyphens and numbers";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if clientId is one that already exists", async () => {
    req.body.clientId = "existing-client-id";
    exampleErrorResponse.clientId = "existing-client-id";
    exampleErrorResponse.validationMessages.clientId =
      "Client Id must be unique and cannot already exist in DfE Sign-in";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  // redirectUrl tests
  it("should render an the page with an error in validationMessages if no redirectUrl is entered", async () => {
    req.body.redirect_uris = "";
    exampleErrorResponse.service.redirectUris = [];
    exampleErrorResponse.validationMessages.redirect_uris =
      "Enter a redirect url";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if redirectUrl over 200 characters", async () => {
    req.body.redirect_uris = "https://" + "Test123456".repeat(30) + ".com"; // 300+ character length string
    exampleErrorResponse.service.redirectUris = [
      "https://" + "Test123456".repeat(30) + ".com",
    ]; // 300+ character length string
    exampleErrorResponse.validationMessages.redirect_uris =
      "Redirect url must be 200 characters or less";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with multiple errors in validationMessages if redirectUrl over 200 characters", async () => {
    req.body.redirect_uris = [
      "invalidurl123",
      "https://" + "Test123456".repeat(30) + ".com",
    ]; // 300+ character length string
    exampleErrorResponse.service.redirectUris = [
      "invalidurl123",
      "https://" + "Test123456".repeat(30) + ".com",
    ]; // 300+ character length string
    exampleErrorResponse.validationMessages.redirect_uris =
      "Redirect url must be a valid url<br/>Redirect url must be 200 characters or less";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if an invalid redirectUrl is entered", async () => {
    req.body.redirect_uris = "anInvalidUrl@slbsh!$$%";
    exampleErrorResponse.service.redirectUris = ["anInvalidUrl@slbsh!$$%"];
    exampleErrorResponse.validationMessages.redirect_uris =
      "Redirect url must be a valid url";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if a multiple invalid redirectUrl are entered", async () => {
    req.body.redirect_uris = ["anInvalidUrl@slbsh!$$%", "another23480349"];
    exampleErrorResponse.service.redirectUris = [
      "anInvalidUrl@slbsh!$$%",
      "another23480349",
    ];
    exampleErrorResponse.validationMessages.redirect_uris =
      "Redirect url must be a valid url<br/>Redirect url must be a valid url";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if redirectUrl with an invalid protocol is entered", async () => {
    req.body.redirect_uris = "ftp://valid-url-com/valid";
    exampleErrorResponse.service.redirectUris = ["ftp://valid-url-com/valid"];
    exampleErrorResponse.validationMessages.redirect_uris =
      "Redirect uri protocol can only be http or https";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with multiple errors in validationMessages if redirectUrl with an invalid protocol is entered", async () => {
    req.body.redirect_uris = ["invalidurl123", "ftp://valid-url-com/valid"];
    exampleErrorResponse.service.redirectUris = [
      "invalidurl123",
      "ftp://valid-url-com/valid",
    ];
    exampleErrorResponse.validationMessages.redirect_uris =
      "Redirect url must be a valid url<br/>Redirect uri protocol can only be http or https";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if a multiple identical redirectUrl are entered", async () => {
    req.body.redirect_uris = ["https://validurl.com", "https://validurl.com"];
    exampleErrorResponse.service.redirectUris = [
      "https://validurl.com",
      "https://validurl.com",
    ];
    exampleErrorResponse.validationMessages.redirect_uris =
      "Redirect urls must all be unique";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  // logOutRedirectUrl tests
  it("should render an the page with an error in validationMessages if logOutRedirectUrl is empty", async () => {
    req.body.post_logout_redirect_uris = undefined;
    exampleErrorResponse.service.postLogoutRedirectUris = [];
    exampleErrorResponse.validationMessages.post_logout_redirect_uris =
      "Enter at least 1 logout redirect URL";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if logOutRedirectUrl over 1024 characters", async () => {
    req.body.post_logout_redirect_uris =
      "https://" + "Test123456".repeat(30) + ".com"; // 300+ character length string
    exampleErrorResponse.service.postLogoutRedirectUris = [
      "https://" + "Test123456".repeat(30) + ".com",
    ]; // 300+ character length string
    exampleErrorResponse.validationMessages.post_logout_redirect_uris =
      "Log out redirect url must be 200 characters or less";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if multiple errors, including logOutRedirectUrl over 1024 characters", async () => {
    req.body.post_logout_redirect_uris = [
      "invalidurl123",
      "https://" + "Test123456".repeat(30) + ".com",
    ]; // 300+ character length string
    exampleErrorResponse.service.postLogoutRedirectUris = [
      "invalidurl123",
      "https://" + "Test123456".repeat(30) + ".com",
    ]; // 300+ character length string
    exampleErrorResponse.validationMessages.post_logout_redirect_uris =
      "Log out redirect url must be a valid url<br/>Log out redirect url must be 200 characters or less";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if an invalid logOutRedirectUrl is entered", async () => {
    req.body.post_logout_redirect_uris = [
      "anInvalidUrl@slbsh!$$%",
      "secondBadOne123",
    ];
    exampleErrorResponse.service.postLogoutRedirectUris = [
      "anInvalidUrl@slbsh!$$%",
      "secondBadOne123",
    ];
    exampleErrorResponse.validationMessages.post_logout_redirect_uris =
      "Log out redirect url must be a valid url<br/>Log out redirect url must be a valid url";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if a multiple invalid logOutRedirectUris are entered", async () => {
    req.body.post_logout_redirect_uris = "anInvalidUrl@slbsh!$$%";
    exampleErrorResponse.service.postLogoutRedirectUris = [
      "anInvalidUrl@slbsh!$$%",
    ];
    exampleErrorResponse.validationMessages.post_logout_redirect_uris =
      "Log out redirect url must be a valid url";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if logOutRedirectUrl with an invalid protocol is entered", async () => {
    req.body.post_logout_redirect_uris = "ftp://valid-url-com/valid";
    exampleErrorResponse.service.postLogoutRedirectUris = [
      "ftp://valid-url-com/valid",
    ];
    exampleErrorResponse.validationMessages.post_logout_redirect_uris =
      "Log out redirect url protocol can only be http or https";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with multiple errors in validationMessages if logOutRedirectUrl with an invalid protocol is entered", async () => {
    req.body.post_logout_redirect_uris = [
      "invalidurl123",
      "ftp://valid-url-com/valid",
    ];
    exampleErrorResponse.service.postLogoutRedirectUris = [
      "invalidurl123",
      "ftp://valid-url-com/valid",
    ];
    exampleErrorResponse.validationMessages.post_logout_redirect_uris =
      "Log out redirect url must be a valid url<br/>Log out redirect url protocol can only be http or https";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages all logOutRedirectUrl are not unique", async () => {
    req.body.post_logout_redirect_uris = [
      "https://validurl.com",
      "https://validurl.com",
      "https://anothervalidurl1234.com",
    ];
    exampleErrorResponse.service.postLogoutRedirectUris = [
      "https://validurl.com",
      "https://validurl.com",
      "https://anothervalidurl1234.com",
    ];
    exampleErrorResponse.validationMessages.post_logout_redirect_uris =
      "Log out redirect urls must all be unique";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if only the token response type is selected", async () => {
    req.body["response_types-code"] = "";
    req.body["response_types-id_token"] = "";
    req.body["response_types-token"] = "responseTypesToken";

    // These 3 aren't part of the test, but modifying these elements makes the test shorter in length
    exampleErrorResponse.responseTypesCode = "";
    exampleErrorResponse.responseTypesToken = "responseTypesToken";
    exampleErrorResponse.refreshToken = undefined;
    exampleErrorResponse.clientSecret = "";

    exampleErrorResponse.validationMessages.responseTypesToken =
      "Select more than 1 response type when 'token' is selected as a response type";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if no response types selected", async () => {
    req.body["response_types-code"] = "";
    req.body["response_types-id_token"] = "";
    req.body["response_types-token"] = "";

    // These 3 aren't part of the test, but modifying these elements makes the test shorter in length
    exampleErrorResponse.responseTypesCode = "";
    exampleErrorResponse.responseTypesToken = "";
    exampleErrorResponse.refreshToken = undefined;
    exampleErrorResponse.clientSecret = "";

    exampleErrorResponse.validationMessages.responseTypes =
      "Select at least 1 response type";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if no clientSecret is entered", async () => {
    req.body.clientSecret = "";
    exampleErrorResponse.clientSecret = "";
    exampleErrorResponse.validationMessages.clientSecret =
      "Enter a client secret";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if clientSecret over 255 characters", async () => {
    req.body.clientSecret = "Test123456".repeat(26); // 260 character length string
    exampleErrorResponse.clientSecret = "Test123456".repeat(26); // 260 character length string
    exampleErrorResponse.validationMessages.clientSecret =
      "Client secret must be 255 characters or less";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if no apiSecret is entered", async () => {
    req.body.apiSecret = "";
    exampleErrorResponse.apiSecret = "";
    exampleErrorResponse.validationMessages.apiSecret = "Enter an api secret";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if apiSecret over 255 characters", async () => {
    req.body.apiSecret = "Test123456".repeat(26); // 260 character length string
    exampleErrorResponse.apiSecret = "Test123456".repeat(26); // 260 character length string
    exampleErrorResponse.validationMessages.apiSecret =
      "Api secret must be 255 characters or less";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });
});
