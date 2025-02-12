jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("../../../src/infrastructure/organisations", () => ({
  editOrganisation: jest.fn(),
  getOrganisationByIdV2: jest.fn(),
}));

const { getRequestMock, getResponseMock } = require("../../utils");
const {
  editOrganisation,
  getOrganisationByIdV2,
} = require("../../../src/infrastructure/organisations");
const postConfirmEditOrganisation = require("../../../src/app/organisations/postConfirmEditOrganisation");

const res = getResponseMock();
const orgResult = { id: "org-1", name: "organisation one" };

describe("when postConfirmEditOrganisation is called", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      session: {
        formData: {
          name: "Test name",
          address: "Test address",
        },
      },
    });

    res.mockResetAll();

    getOrganisationByIdV2.mockReset().mockReturnValue(orgResult);
    editOrganisation.mockReset().mockReturnValue({});
  });

  it("should redirect to the confirm page on success", async () => {
    await postConfirmEditOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/organisations/org-1/users");
    expect(res.flash.mock.calls).toHaveLength(1);
    expect(editOrganisation).toHaveBeenCalledTimes(1);
  });

  it("should redirect back to /organisations if nothing is in the session", async () => {
    req.session = {};

    await postConfirmEditOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/organisations/org-1/users");
    expect(editOrganisation).toHaveBeenCalledTimes(0);
  });
});
