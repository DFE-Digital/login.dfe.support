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
      layout: "sharedViews/layout.ejs",
      backLink: true,
      cancelLink: "/users",
    };
  });

  it("should redirect to the users page on success", async () => {
    await postChooseServiceType(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      "/services/service-name-and-description",
    );
    expect(sendResult).toHaveBeenCalledTimes(0);
  });

  it("should redirect to the users page on success and existing session data updated", async () => {
    // Session data set up to represent back link or change button from a future page
    ((req.session.createServiceData = {
      serviceType: "idOnlyServiceType",
      name: "Test name",
      description: "Test description",
    }),
      await postChooseServiceType(req, res));

    // Note hideFromUserServices and hideFromContactUs now populated
    expect(req.session.createServiceData).toStrictEqual({
      serviceType: "idOnlyServiceType",
      name: "Test name",
      description: "Test description",
      hideFromUserServices: "hideFromUserServices",
      hideFromContactUs: "hideFromContactUs",
      validationMessages: {},
    });
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(
      "/services/service-name-and-description",
    );
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
        cancelLink: "/users",
        currentPage: "services",
        layout: "sharedViews/layout.ejs",
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
