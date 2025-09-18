jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/app/users/utils");
jest.mock("./../../../src/infrastructure/directories");

const logger = require("./../../../src/infrastructure/logger");
const {
  getUserDetails,
  getUserDetailsById,
  updateUserDetails,
} = require("./../../../src/app/users/utils");
const {
  getUser,
  createChangeEmailCode,
  updateInvite,
  getChangeEmailCode,
  deleteChangeEmailCode,
} = require("./../../../src/infrastructure/directories");
const postEditEmail = require("./../../../src/app/users/postEditEmail");

const userDetails = {
  id: "915a7382-576b-4699-ad07-a9fd329d3867",
  name: "Bobby Grint",
  firstName: "Bobby",
  lastName: "Grint",
  email: "rupert.grint@hogwarts.test",
  lastLogin: null,
  status: {
    id: 1,
    description: "Active",
  },
  loginsInPast12Months: {
    successful: 0,
  },
};
const inviteDetails = {
  id: "inv-35f60ab3-e169-41ec-bc88-d80e1beef937",
  name: "Bobby Grint",
  firstName: "Bobby",
  lastName: "Grint",
  email: "rupert.grint@hogwarts.test",
  lastLogin: null,
  status: {
    id: 1,
    description: "Active",
  },
  loginsInPast12Months: {
    successful: 0,
  },
};

const codeDetails = {
  uid: "915a7382-576b-4699-ad07-a9fd329d3867",
  code: "HHRSSGWH",
  clientId: "support",
  redirectUri: "na",
  contextData: null,
  email: "rupert.grint@hogwarts.test",
  codeType: "changeemail",
  createdAt: "2023-05-25T10:27:54.393Z",
  updatedAt: "2023-05-26T09:27:54.393Z",
};

describe("when changing email address", () => {
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
        email: "rupert.grint@hogwarts.school.test",
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

    getUserDetails.mockReset().mockReturnValue(userDetails);

    getUserDetailsById.mockReset().mockReturnValue(userDetails);

    updateUserDetails.mockReset();

    getUser.mockReset();

    createChangeEmailCode.mockReset();

    getChangeEmailCode.mockReset().mockReturnValue(codeDetails);

    deleteChangeEmailCode.mockReset();

    updateInvite.mockReset();
  });

  it("then it should render view if email is not entered", async () => {
    req.body.email = undefined;

    await postEditEmail(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/editEmail");
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      layout: "sharedViews/layout.ejs",
      backLink: "services",
      email: "",
      user: userDetails,
      validationMessages: {
        email: "Please enter email address",
      },
    });
  });

  it("then it should render view if email is not valid", async () => {
    req.body.email = "not-an-email-address";

    await postEditEmail(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/editEmail");
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      backLink: "services",
      layout: "sharedViews/layout.ejs",
      email: "not-an-email-address",
      user: userDetails,
      validationMessages: {
        email: "Please enter a valid email address",
      },
    });
  });

  it("then it should render view if email already associated to a user", async () => {
    getUser.mockReturnValue({});

    await postEditEmail(req, res);

    expect(res.render.mock.calls).toHaveLength(1);
    expect(res.render.mock.calls[0][0]).toBe("users/views/editEmail");
    expect(res.render.mock.calls[0][1]).toEqual({
      csrfToken: "token",
      layout: "sharedViews/layout.ejs",
      backLink: "services",
      email: "rupert.grint@hogwarts.school.test",
      user: userDetails,
      validationMessages: {
        email: "A DfE Sign-in user already exists with that email address",
      },
    });
  });

  it("then it should redirect to users service tab", async () => {
    await postEditEmail(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("services");
  });

  describe("for a user", () => {
    it("then it should create a change email code for user", async () => {
      await postEditEmail(req, res);

      expect(createChangeEmailCode.mock.calls).toHaveLength(1);
      expect(createChangeEmailCode.mock.calls[0][0]).toBe(
        "915a7382-576b-4699-ad07-a9fd329d3867",
      );
      expect(createChangeEmailCode.mock.calls[0][1]).toBe(
        "rupert.grint@hogwarts.school.test",
      );
      expect(createChangeEmailCode.mock.calls[0][2]).toBe("support");
      expect(createChangeEmailCode.mock.calls[0][3]).toBe("na");
      expect(createChangeEmailCode.mock.calls[0][4]).toBe("correlationId");
    });

    it("then it should re-generate a new change email code for user if old one is expired", async () => {
      await postEditEmail(req, res);

      expect(deleteChangeEmailCode.mock.calls).toHaveLength(1);
      expect(createChangeEmailCode.mock.calls).toHaveLength(1);
      expect(createChangeEmailCode.mock.calls[0][0]).toBe(
        "915a7382-576b-4699-ad07-a9fd329d3867",
      );
      expect(createChangeEmailCode.mock.calls[0][1]).toBe(
        "rupert.grint@hogwarts.school.test",
      );
      expect(createChangeEmailCode.mock.calls[0][2]).toBe("support");
      expect(createChangeEmailCode.mock.calls[0][3]).toBe("na");
      expect(createChangeEmailCode.mock.calls[0][4]).toBe("correlationId");
    });

    it("then it should update user in search index", async () => {
      await postEditEmail(req, res);

      expect(updateUserDetails.mock.calls).toHaveLength(1);
      expect(updateUserDetails.mock.calls[0][0]).toMatchObject({
        id: "915a7382-576b-4699-ad07-a9fd329d3867",
        pendingEmail: "rupert.grint@hogwarts.school.test",
      });
    });

    it("then it should audit change", async () => {
      await postEditEmail(req, res);

      expect(logger.audit.mock.calls).toHaveLength(1);
      expect(logger.audit.mock.calls[0][0]).toBe(
        "super.user@unit.test (id: suser1) initiated a change of email for rupert.grint@hogwarts.test (id: 915a7382-576b-4699-ad07-a9fd329d3867) to rupert.grint@hogwarts.school.test",
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
            oldValue: "rupert.grint@hogwarts.test",
            newValue: "rupert.grint@hogwarts.school.test",
          },
        ],
      });
    });
  });

  describe("for an invitation", () => {
    beforeEach(() => {
      req.params.uid = "inv-35f60ab3-e169-41ec-bc88-d80e1beef937";

      getUserDetails.mockReturnValue(Object.assign({}, inviteDetails));

      getUserDetailsById.mockReturnValue(Object.assign({}, inviteDetails));
    });

    it("then it should update invitation with new email", async () => {
      await postEditEmail(req, res);

      expect(updateInvite.mock.calls).toHaveLength(1);
      expect(updateInvite.mock.calls[0][0]).toBe(
        "35f60ab3-e169-41ec-bc88-d80e1beef937",
      );
    });

    it("then it should update invitation in search index", async () => {
      await postEditEmail(req, res);

      expect(updateUserDetails.mock.calls).toHaveLength(1);
      expect(updateUserDetails.mock.calls[0][0]).toMatchObject({
        id: "inv-35f60ab3-e169-41ec-bc88-d80e1beef937",
        email: "rupert.grint@hogwarts.school.test",
      });
    });

    it("then it should audit change", async () => {
      await postEditEmail(req, res);

      expect(logger.audit.mock.calls).toHaveLength(1);
      expect(logger.audit.mock.calls[0][0]).toBe(
        "super.user@unit.test (id: suser1) changed email on invitation for rupert.grint@hogwarts.test (id: inv-35f60ab3-e169-41ec-bc88-d80e1beef937) to rupert.grint@hogwarts.school.test",
      );
      expect(logger.audit.mock.calls[0][1]).toEqual({
        type: "support",
        subType: "user-invite-editemail",
        userId: "suser1",
        userEmail: "super.user@unit.test",
        editedUser: "inv-35f60ab3-e169-41ec-bc88-d80e1beef937",
        editedFields: [
          {
            name: "new_email",
            oldValue: "rupert.grint@hogwarts.test",
            newValue: "rupert.grint@hogwarts.school.test",
          },
        ],
      });
    });
  });
});
