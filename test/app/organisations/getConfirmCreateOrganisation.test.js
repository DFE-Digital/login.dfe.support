jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");

const { getRequestMock, getResponseMock } = require("../../utils");
const { sendResult } = require("../../../src/infrastructure/utils");
const getConfirmCreateOrganisation = require("../../../src/app/organisations/getConfirmCreateOrganisation");

const res = getResponseMock();

describe("when displaying the get confirm create organisations", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      session: {
        createOrgData: {
          name: "Test name",
          address: "123 address street",
          ukprn: "12345678",
          category: "008",
          upin: "",
          urn: "",
        },
      },
    });
    res.mockResetAll();
  });

  it("should redirect to the organisations page if there is no createOrgData session data", async () => {
    req = getRequestMock();
    await getConfirmCreateOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/organisations");
    expect(sendResult).toHaveBeenCalledTimes(0);
  });

  it("should return the confirm create organisation view when data is in the session", async () => {
    await getConfirmCreateOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult).toHaveBeenCalledWith(
      req,
      res,
      "organisations/views/confirmCreateOrganisation",
      {
        csrfToken: req.csrfToken(),
        backLink: true,
        currentPage: "organisations",
        layout: "sharedViews/layoutNew.ejs",
        validationMessages: {},
        name: "Test name",
        address: "123 address street",
        ukprn: "12345678",
        category: "008",
        upin: "",
        urn: "",
      },
    );
  });
});
