jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");

const { getRequestMock, getResponseMock } = require("../../utils");
const { sendResult } = require("../../../src/infrastructure/utils");
const postChooseServiceType = require("../../../src/app/services/postChooseServiceType");

const res = getResponseMock();

describe("when displaying the post choose service type screen", () => {
  let req;
  let exampleErrorResponse;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        serviceType: "idOnlyServiceType",
        hideFromUserServices: "hideFromUserServices",
        hideFromContactUs: "hideFromContactUs",
      },
      session: {
        save: jest.fn((cb) => cb()),
      },
    });
    res.mockResetAll();

    sendResult.mockReset();

    // Example data that each error test can modify so it doens't need to be copied
    // again and again
    exampleErrorResponse = {
      serviceType: "standardServiceType",
      hideFromUserServices: "hideFromUserServices",
      hideFromContactUs: "hideFromContactUs",
      validationMessages: {},
      csrfToken: "token",
      currentPage: "services",
      layout: "sharedViews/layoutNew.ejs",
      backLink: true,
    };
  });

  // This is only temporary until more of the journey has been built
  it("should redirect to the users page on success", async () => {
    await postChooseServiceType(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/users");
    expect(sendResult).toHaveBeenCalledTimes(0);
  });

  it("should render the page if there is an error saving to the session", async () => {
    req.session = {
      save: jest.fn((cb) => cb("Something went wrong")),
    };

    await postChooseServiceType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult).toHaveBeenCalledWith(
      req,
      res,
      "services/views/chooseServiceType",
      {
        csrfToken: req.csrfToken(),
        backLink: true,
        currentPage: "services",
        layout: "sharedViews/layoutNew.ejs",
        serviceType: "idOnlyServiceType",
        hideFromUserServices: "hideFromUserServices",
        hideFromContactUs: "hideFromContactUs",
        validationMessages: {
          serviceType: "Something went wrong submitting data, please try again",
        },
      },
    );
  });

  it("should render an the page with an error in validationMessages if no type is selected", async () => {
    req.body.serviceType = "";
    exampleErrorResponse.serviceType = "";
    exampleErrorResponse.validationMessages.serviceType =
      "A service type must be selected";

    await postChooseServiceType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });

  it("should render an the page with an error in validationMessages the standard type is selected", async () => {
    req.body.serviceType = "standardServiceType";
    exampleErrorResponse.serviceType = "standardServiceType";
    exampleErrorResponse.validationMessages.serviceType =
      "The standard service type is not available yet. Only ID-only services can be created";

    await postChooseServiceType(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult.mock.calls[0][3]).toStrictEqual(exampleErrorResponse);
  });
});
