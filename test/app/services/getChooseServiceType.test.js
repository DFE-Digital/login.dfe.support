jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");

const { getRequestMock, getResponseMock } = require("../../utils");
const { sendResult } = require("../../../src/infrastructure/utils");
const getChooseServiceType = require("../../../src/app/services/getChooseServiceType");

const res = getResponseMock();

describe("when displaying the get choose service type", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock();
    res.mockResetAll();
  });

  it("then it should return the get choose service type view", async () => {
    ((req.session = {
      createServiceData: {
        serviceType: "idOnlyServiceType",
        hideFromUserServices: undefined,
        hideFromContactUs: undefined,
        name: "Test name",
        description: "Test description",
      },
    }),
      await getChooseServiceType(req, res));

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
        validationMessages: {},
        serviceType: "idOnlyServiceType",
        hideFromContactUs: undefined,
        hideFromUserServices: undefined,
      },
    );
  });

  it("then it should return the get choose service type view", async () => {
    await getChooseServiceType(req, res);

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
        validationMessages: {},
      },
    );
  });
});
