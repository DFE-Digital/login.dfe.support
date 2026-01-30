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
        uid: "updated-user-id",
      },
      body: {
        firstName: "Rupert",
        lastName: "Grint",
      },
      user: {
        sub: "support-user-id",
        email: "super.user@unit.test",
      },
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    };

    logger.audit.mockReset();

    const userDetails = {
      id: "updated-user-id",
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
    };

    // Need to force 2 separate objects for the 2 invocations of this function
    getUserDetailsById
      .mockReset()
      .mockReturnValueOnce(structuredClone(userDetails))
      .mockReturnValue(structuredClone(userDetails));

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
      userId: "updated-user-id",
    });
  });

  it("then it should update user in search index", async () => {
    await postEditProfile(req, res);

    expect(updateUserDetails.mock.calls).toHaveLength(1);
    expect(updateUserDetails.mock.calls[0][0]).toMatchObject({
      id: "updated-user-id",
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
      "super.user@unit.test (id: support-user-id) updated user rupert.grint@hogwarts.test (id: updated-user-id)",
    );
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: "support",
      subType: "user-edit",
      userId: "support-user-id",
      userEmail: "super.user@unit.test",
      editedUser: "updated-user-id",
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
    req.params.uid = "inv-updated-user-id";

    await postEditProfile(req, res);

    expect(updateUser).not.toHaveBeenCalled();
    expect(updateInvitation).toHaveBeenCalled();
    expect(updateInvitation).toHaveBeenCalledWith({
      firstName: "Rupert",
      invitationId: "updated-user-id",
      lastName: "Grint",
    });
  });
});
