jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/utils");
jest.mock("login.dfe.api-client/organisations");

const { getRequestMock, getResponseMock } = require("../../utils");
const { sendResult } = require("../../../src/infrastructure/utils");
const { createOrganisation } = require("login.dfe.api-client/organisations");
const postConfirmCreateOrganisation = require("../../../src/app/organisations/postConfirmCreateOrganisation");

const res = getResponseMock();

describe("when displaying the get create organisations", () => {
  let req;
  beforeEach(() => {
    req = getRequestMock({
      session: {
        createOrgData: {
          name: "Test name",
          address: "Test address",
          ukprn: "12345678",
          category: "008",
          upin: "123456",
          urn: "654321",
          validationMessages: {},
        },
      },
    });
    res.mockResetAll();

    createOrganisation.mockReset().mockReturnValue({});
  });

  it("should redirect to the confirm page on success", async () => {
    await postConfirmCreateOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/organisations");
    expect(res.flash.mock.calls).toHaveLength(1);
    expect(sendResult).toHaveBeenCalledTimes(0);
  });

  it("should redirect back to /organisations if nothing is in the session", async () => {
    req.session = {};

    await postConfirmCreateOrganisation(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/organisations");
    expect(sendResult).toHaveBeenCalledTimes(0);
  });
});
