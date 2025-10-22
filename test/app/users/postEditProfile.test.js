jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/app/users/utils");
jest.mock("login.dfe.api-client/invitations");
jest.mock("./../../../src/infrastructure/users");
jest.mock("login.dfe.api-client/users", () => ({
  updateUser: jest.fn(),
}));

const logger = require("./../../../src/infrastructure/logger");
const {
  getUserDetails,
  getUserDetailsById,
  updateUserDetails,
} = require("./../../../src/app/users/utils");
const { updateInvitation } = require("login.dfe.api-client/invitations");
const postEditProfile = require("./../../../src/app/users/postEditProfile");
const { updateUser } = require("login.dfe.api-client/users");

describe("when updating users profile details", () => {
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
      body: {
        firstName: "Rupert",
        lastName: "Grint",
      },
      user: {
        sub: "suser1",
        email: "super.user@unit.test",
      },
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    };

    logger.audit.mockReset();

    getUserDetails.mockReset().mockReturnValue({
      id: "915a7382-576b-4699-ad07-a9fd329d3867",
      name: "Bobby Grint",
      firstName: "Bobby",
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
    });

    getUserDetailsById.mockReset().mockReturnValue({
      id: "915a7382-576b-4699-ad07-a9fd329d3867",
      name: "Bobby Grint",
      firstName: "Bobby",
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
    });

    updateUserDetails.mockReset();

    updateUser.mockReset();
    updateInvitation.mockReset();
  });

  it("then it should render view if firstName missing", async () => {
    req.body.firstName = undefined;

    await postEditProfile(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/editProfile");
    expect(res.render.mock.calls[0][1]).toMatchObject({
      validationMessages: {
        firstName: "Please specify a first name",
      },
    });
  });

  it("then it should render view if lastName missing", async () => {
    req.body.lastName = undefined;

    await postEditProfile(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/editProfile");
    expect(res.render.mock.calls[0][1]).toMatchObject({
      validationMessages: {
        lastName: "Please specify a last name",
      },
    });
  });

  it("then it should update user in directories", async () => {
    await postEditProfile(req, res);

    expect(updateUser).toHaveBeenCalledTimes(1);
    expect(updateUser).toHaveBeenCalledWith({
      update: { familyName: "Grint", givenName: "Rupert" },
      userId: "915a7382-576b-4699-ad07-a9fd329d3867",
    });
  });

  it("then it should update user in search index", async () => {
    await postEditProfile(req, res);

    expect(updateUserDetails.mock.calls).toHaveLength(1);
    expect(updateUserDetails.mock.calls[0][0]).toMatchObject({
      id: "915a7382-576b-4699-ad07-a9fd329d3867",
      name: "Rupert Grint",
      email: "rupert.grint@hogwarts.test",
      organisationName: "Hogwarts School of Witchcraft and Wizardry",
      lastLogin: null,
      status: {
        id: 1,
        description: "Active",
      },
    });
  });

  it("then it should redirect to user services", async () => {
    await postEditProfile(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("services");
  });

  it("then it should audit update of user", async () => {
    await postEditProfile(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe(
      "super.user@unit.test (id: suser1) updated user rupert.grint@hogwarts.test (id: 915a7382-576b-4699-ad07-a9fd329d3867)",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "support",
      subType: "user-edit",
      userId: "suser1",
      userEmail: "super.user@unit.test",
      editedUser: "915a7382-576b-4699-ad07-a9fd329d3867",
      editedFields: [
        {
          name: "given_name",
          oldValue: "Bobby",
          newValue: "Rupert",
        },
      ],
    });
  });

  it("should call updateInvitation if updating an invited user", async () => {
    req.params.uid = "inv-915a7382-576b-4699-ad07-a9fd329d3867";

    await postEditProfile(req, res);

    expect(updateUser).not.toHaveBeenCalled();
    expect(updateInvitation).toHaveBeenCalled();
    expect(updateInvitation).toHaveBeenCalledWith({
      firstName: "Rupert",
      invitationId: "915a7382-576b-4699-ad07-a9fd329d3867",
      lastName: "Grint",
    });
  });
});
