jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("./../../../src/infrastructure/organisations");

const { getRequestMock, getResponseMock } = require("../../utils");
const { sendResult } = require("../../../src/infrastructure/utils");
const getConfirmEditOrganisation = require("../../../src/app/organisations/getConfirmEditOrganisation");
const {
  getOrganisationByIdV2,
} = require("./../../../src/infrastructure/organisations");

const res = getResponseMock();
const orgResult = { id: "org-1", name: "organisation one" };

describe("when calling getConfirmEditOrganisation", () => {
  let req;

  beforeEach(() => {
    getOrganisationByIdV2.mockReset().mockReturnValue(orgResult);
    req = getRequestMock({
      session: {
        formData: {
          legalName: "Test name",
          address: "123 address street",
        },
      },
    });
    res.mockResetAll();
  });

  it("should return the confirm edit organisation view", async () => {
    await getConfirmEditOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult).toHaveBeenCalledWith(
      req,
      res,
      "organisations/views/confirmEditOrganisation",
      {
        csrfToken: req.csrfToken(),
        organisation: orgResult,
        legalName: "Test name",
        address: "123 address street",
        backLink: true,
        validationMessages: {},
      },
    );
  });
});
