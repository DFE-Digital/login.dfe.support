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
const postServiceNameAndDescription = require("../../../src/app/services/postServiceNameAndDescription");

const res = getResponseMock();

describe("when displaying the post choose service type screen", () => {
  let req;
  let exampleErrorResponse;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        name: "Test name",
        description: "Test description",
      },
      session: {
        createServiceData: {
          serviceType: "idOnlyServiceType",
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
      name: "Test name",
      description: "Test description",
      validationMessages: {},
      csrfToken: "token",
      currentPage: "services",
      layout: "sharedViews/layout.ejs",
      backLink: true,
      cancelLink: "/users",
    };
  });

  it("should redirect to the service urls and response type page on success", async () => {
    await postServiceNameAndDescription(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      "service-urls-and-response-type",
    );
    expect(sendResult).toHaveBeenCalledTimes(0);
  });

  it("should render the page if there is an error saving to the session", async () => {
    req.session = {
      createServiceData: {
        serviceType: "idOnlyServiceType",
      },
      save: jest.fn((cb) => cb("Something went wrong")),
    };

    await postServiceNameAndDescription(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult).toHaveBeenCalledWith(
      req,
      res,
      "services/views/serviceNameAndDescription",
      {
        csrfToken: req.csrfToken(),
        backLink: true,
        cancelLink: "/users",
        currentPage: "services",
        layout: "sharedViews/layout.ejs",
        name: "Test name",
        description: "Test description",
        validationMessages: {
          name: "Something went wrong submitting data, please try again",
        },
      },
    );
  });

  it("should render an the page with an error in validationMessages if no name is selected", async () => {
    req.body.name = "";
    exampleErrorResponse.name = "";
    exampleErrorResponse.validationMessages.name = "Enter a name";

    await postServiceNameAndDescription(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if no description is selected", async () => {
    req.body.description = "";
    exampleErrorResponse.description = "";
    exampleErrorResponse.validationMessages.description = "Enter a description";

    await postServiceNameAndDescription(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if name over 200 characters", async () => {
    req.body.name = "Test123456".repeat(21); // 210 character length string
    exampleErrorResponse.name = "Test123456".repeat(21); // 210 character length string
    exampleErrorResponse.validationMessages.name =
      "Name must be 200 characters or less";

    await postServiceNameAndDescription(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if description over 400 characters", async () => {
    req.body.description = "Test123456".repeat(41); // 410 character length string
    exampleErrorResponse.description = "Test123456".repeat(41); // 410 character length string
    exampleErrorResponse.validationMessages.description =
      "Description must be 400 characters or less";

    await postServiceNameAndDescription(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages if name matches existing name", async () => {
    req.body.name = "Existing service name";
    exampleErrorResponse.name = "Existing service name";
    exampleErrorResponse.validationMessages.name =
      "Service name must be unique and cannot already exist in DfE Sign-in";

    await postServiceNameAndDescription(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });
});
