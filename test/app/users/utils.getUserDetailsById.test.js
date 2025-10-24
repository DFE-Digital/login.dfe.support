jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("login.dfe.api-client/invitations");

const { getInvitationRaw } = require("login.dfe.api-client/invitations");
const { getUserDetailsById } = require("../../../src/app/users/utils");

describe("When getting user details for an invited user", () => {
  let req;

  beforeEach(() => {
    getInvitationRaw.mockReset().mockReturnValue({
      id: "inv-user1",
      name: "Albus Dumbledore",
      firstName: "Albus",
      lastName: "Dumbledore",
      email: "headmaster@hogwarts.com",
      deactivated: false,
      organisation: null,
      lastLogin: null,
      successfulLoginsInPast12Months: 0,
    });

    req = {
      params: {
        uid: "inv-user1",
      },
      externalAuth: {
        getEntraAccountIdByEmail: jest.fn(),
      },
    };
  });

  it("then it should return an object when getInvitationRaw returns a record", async () => {
    const result = await getUserDetailsById(req.params.uid, req);

    expect(result).toMatchObject({
      id: "inv-user1",
      name: "Albus Dumbledore",
      firstName: "Albus",
      lastName: "Dumbledore",
      email: "headmaster@hogwarts.com",
      lastLogin: null,
      status: { id: -1, description: "Invited", changedOn: null },
      loginsInPast12Months: {
        successful: 0,
      },
      deactivated: false,
    });

    expect(getInvitationRaw.mock.calls).toHaveLength(1);
    expect(getInvitationRaw).toHaveBeenCalledWith({ by: { id: "user1" } });
  });
});
