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

  it("then it should return the create organisation view", async () => {
    await getChooseServiceType(req, res);

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
        validationMessages: {},
      },
    );
  });
});
