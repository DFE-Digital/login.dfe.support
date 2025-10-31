jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/app/users/utils");
jest.mock("login.dfe.api-client/users");

const logger = require("./../../../src/infrastructure/logger");
const {
  getUserDetailsById,
  updateUserDetails,
} = require("./../../../src/app/users/utils");
const { deleteUserVerificationCode } = require("login.dfe.api-client/users");
const postCancelChangeEmail = require("./../../../src/app/users/postCancelChangeEmail");

describe("when cancelling the change of email for a user", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      id: "correlationId",
      csrfToken: () => "token",
      accepts: () => ["text/html"],
      params: {
        uid: "915a7382-576b-4699-ad07-a9fd329d3867",
      },
      user: {
        sub: "suser1",
        email: "super.user@unit.test",
      },
    };

    res = {
      redirect: jest.fn(),
    };

    logger.audit.mockReset();

    const userDetails = {
      id: "915a7382-576b-4699-ad07-a9fd329d3867",
      name: "Rupert Grint",
      firstName: "Rupert",
      lastName: "Grint",
      email: "rupert.grint@hogwarts.test",
      organisationName: "Hogwarts School of Witchcraft and Wizardry",
      lastLogin: null,
      status: {
        id: 1,
        description: "Active",
      },
      loginsInPast12Months: {
        successful: 0,
      },
      pendingEmail: "rupert.grint@hogwarts-school.test",
    };

    // Need to force 2 separate objects for the 2 invocations of this function
    getUserDetailsById
      .mockReset()
      .mockReturnValueOnce(structuredClone(userDetails))
      .mockReturnValue(structuredClone(userDetails));

    updateUserDetails.mockReset();
  });

  it("then it should delete the users change email code", async () => {
    await postCancelChangeEmail(req, res);

    expect(deleteUserVerificationCode.mock.calls).toHaveLength(1);
    expect(deleteUserVerificationCode).toHaveBeenCalledWith({
      userId: "915a7382-576b-4699-ad07-a9fd329d3867",
      verificationCodeType: "changeemail",
    });
  });

  it("then it should update user in index", async () => {
    await postCancelChangeEmail(req, res);

    expect(updateUserDetails.mock.calls).toHaveLength(1);
    expect(updateUserDetails.mock.calls[0][0].pendingEmail).toBeNull();
  });

  it("then it should audit cancellation", async () => {
    await postCancelChangeEmail(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "super.user@unit.test (id: suser1) cancelled the change of email for rupert.grint@hogwarts.test (id: 915a7382-576b-4699-ad07-a9fd329d3867) to email rupert.grint@hogwarts-school.test",
    );
    expect(logger.audit.mock.calls[0][1]).toEqual({
      type: "support",
      subType: "user-editemail",
      userId: "suser1",
      userEmail: "super.user@unit.test",
      editedUser: "915a7382-576b-4699-ad07-a9fd329d3867",
      editedFields: [
        {
          name: "new_email",
          oldValue: "rupert.grint@hogwarts-school.test",
          newValue: "",
        },
      ],
    });
  });

  it("then it should redirect to services", async () => {
    await postCancelChangeEmail(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("services");
  });
});
