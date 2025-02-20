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
        redirectUrl: "https://test-url.com/redirect",
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
      redirectUrl: "https://test-url.com/redirect",
      clientSecret: "client-secret",
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
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
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
        redirectUrl: "https://test-url.com/redirect",
        clientSecret: "client-secret",
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

  it("should render an the page with an error in validationMessages if postPasswordResetUrl over 1024 characters", async () => {
    req.body.postPasswordResetUrl = "Test123456".repeat(125); // 1250 character length string
    exampleErrorResponse.postPasswordResetUrl = "Test123456".repeat(125); // 1250 character length string
    exampleErrorResponse.validationMessages.postPasswordResetUrl =
      "Post password reset url must be 1024 characters or less";

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
    req.body.homeUrl = "Test123456".repeat(125); // 1250 character length string
    exampleErrorResponse.homeUrl = "Test123456".repeat(125); // 1250 character length string
    exampleErrorResponse.validationMessages.homeUrl =
      "Home url must be 1024 characters or less";

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

  it("should render an the page with an error in validationMessages if no redirectUrl is entered", async () => {
    req.body.redirectUrl = "";
    exampleErrorResponse.redirectUrl = "";
    exampleErrorResponse.validationMessages.redirectUrl =
      "Enter a redirect url";

    await postServiceUrlsAndResponseType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if redirectUrl over 1024 characters", async () => {
    req.body.redirectUrl = "Test123456".repeat(125); // 1250 character length string
    exampleErrorResponse.redirectUrl = "Test123456".repeat(125); // 1250 character length string
    exampleErrorResponse.validationMessages.redirectUrl =
      "Redirect url must be 1024 characters or less";

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
