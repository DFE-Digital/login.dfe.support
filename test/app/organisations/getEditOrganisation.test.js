jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("login.dfe.api-client/organisations");

const { getRequestMock, getResponseMock } = require("../../utils");
const { sendResult } = require("../../../src/infrastructure/utils");
const getEditOrganisation = require("../../../src/app/organisations/getEditOrganisation");
const { getOrganisationRaw } = require("login.dfe.api-client/organisations");

const res = getResponseMock();
const orgResult = { id: "org-1", name: "organisation one" };

describe("when calling getEditOrganisations", () => {
  let req;

  beforeEach(() => {
    getOrganisationRaw.mockReset().mockReturnValue(orgResult);
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
        currentPage: "organisations",
        backlink: "users",
        validationMessages: {},
      },
    );
  });
});
