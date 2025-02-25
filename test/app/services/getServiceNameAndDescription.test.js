jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");

const { getRequestMock, getResponseMock } = require("../../utils");
const { sendResult } = require("../../../src/infrastructure/utils");
const getServiceNameAndDescription = require("../../../src/app/services/getServiceNameAndDescription");

const res = getResponseMock();

describe("when displaying the get service name and description page", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock();
    res.mockResetAll();
  });

  it("then it should return the serviceNameAndDescription view", async () => {
    await getServiceNameAndDescription(req, res);

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
        layout: "sharedViews/layoutNew.ejs",
        validationMessages: {},
      },
    );
  });
});
