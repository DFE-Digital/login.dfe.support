jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/directories");

const { getInvitation } = require("../../../src/infrastructure/directories");
const { getUserDetails } = require("../../../src/app/users/utils");

describe("When getting user details for an invited user", () => {
  let req;
  const correlationId = "correlation-id";

  beforeEach(() => {
    getInvitation.mockReset().mockReturnValue({
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
    };
  });

  it("then it should return an object when getInvitation returns a record", async () => {
    const result = await getUserDetails(req, correlationId);

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

    expect(getInvitation.mock.calls).toHaveLength(1);
    expect(getInvitation.mock.calls[0][0]).toBe("user1");
  });
});
