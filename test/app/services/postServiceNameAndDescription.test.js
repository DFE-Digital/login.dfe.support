jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");

const { getRequestMock, getResponseMock } = require("../../utils");
const { sendResult } = require("../../../src/infrastructure/utils");
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

    // Example data that each error test can modify so it doens't need to be copied
    // again and again
    exampleErrorResponse = {
      name: "Test name",
      description: "Test description",
      validationMessages: {},
      csrfToken: "token",
      currentPage: "services",
      layout: "sharedViews/layoutNew.ejs",
      backLink: true,
    };
  });

  // This is only temporary until more of the journey has been built
  it("should redirect to the users page on success", async () => {
    await postServiceNameAndDescription(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
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
        currentPage: "services",
        layout: "sharedViews/layoutNew.ejs",
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

  it("should render an the page with an error in validationMessages if description over 200 characters", async () => {
    req.body.description = "Test123456".repeat(21); // 210 character length string
    exampleErrorResponse.description = "Test123456".repeat(21); // 210 character length string
    exampleErrorResponse.validationMessages.description =
      "Description must be 200 characters or less";

    await postServiceNameAndDescription(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });
});
