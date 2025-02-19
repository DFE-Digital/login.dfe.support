jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("./../../../src/infrastructure/organisations");

const { getRequestMock, getResponseMock } = require("../../utils");
const { sendResult } = require("../../../src/infrastructure/utils");
const getEditOrganisation = require("../../../src/app/organisations/getEditOrganisation");
const {
  getOrganisationByIdV2,
} = require("./../../../src/infrastructure/organisations");

const res = getResponseMock();
const orgResult = { id: "org-1", name: "organisation one" };

describe("when calling getEditOrganisations", () => {
  let req;

  beforeEach(() => {
    getOrganisationByIdV2.mockReset().mockReturnValue(orgResult);
    req = getRequestMock();
    res.mockResetAll();
  });

  it("should return the edit organisation view", async () => {
    await getEditOrganisation(req, res);

    expect(sendResult).toHaveBeenCalledTimes(1);
    expect(sendResult).toHaveBeenCalledWith(
      req,
      res,
      "organisations/views/editOrganisation",
      {
        csrfToken: req.csrfToken(),
        organisation: orgResult,
        backlink: "users",
        validationMessages: {},
      },
    );
  });
});
