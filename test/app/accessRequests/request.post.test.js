jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/app/accessRequests/utils", () => {
  return {
    putUserInOrganisation: jest.fn().mockReturnValue({}),
  };
});
jest.mock("./../../../src/infrastructure/organisations", () => {
  return {
    setUserAccessToOrganisation: jest.fn().mockReturnValue(),
  };
});

const utils = require("./../../../src/app/accessRequests/utils");
const organisations = require("./../../../src/infrastructure/organisations");
const { getRequestMock, getResponseMock } = require("./../../utils");
const { post } = require("./../../../src/app/accessRequests/accessRequest");

describe("When processing a post for access requests", () => {
  let req;
  let res;

  beforeEach(() => {
    req = getRequestMock({
      method: "POST",
      body: {
        name: "test user",
        org_name: "test org",
        userOrgId: "userorg1",
        userId: "user1",
        orgId: "org1",
        status: "1",
        roleId: "2",
        approve_reject: "Approve",
      },
      csrfToken: () => {
        return "token";
      },
    });

    res = getResponseMock();

    utils.putUserInOrganisation.mockReset();
    utils.putUserInOrganisation.mockReturnValue();

    organisations.setUserAccessToOrganisation.mockReset();
    organisations.setUserAccessToOrganisation.mockReturnValue();
  });

  test("then it should call putUserIngOrg", async () => {
    await post(req, res);

    expect(utils.putUserInOrganisation.mock.calls).toHaveLength(1);
    expect(utils.putUserInOrganisation.mock.calls[0][0]).toBe(req);
  });

  test("then you are redirected to the access requests page with a flash message", async () => {
    await post(req, res);

    expect(res.flash.mock.calls[0][1]).toBe(
      "Access request approved. test user is now associated with test org",
    );
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("/access-requests");
  });
});
