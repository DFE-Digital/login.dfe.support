jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/invitations");
jest.mock("login.dfe.api-client/organisations");
jest.mock("./../../../src/app/users/utils");
jest.mock("./../../../src/app/users/userSearchHelpers/updateUserSearchIndex");

const logger = require("./../../../src/infrastructure/logger");
const {
  createInvitation,
  addOrganisationToInvitation,
} = require("login.dfe.api-client/invitations");
const { waitForIndexToUpdate } = require("./../../../src/app/users/utils");
const {
  updateUserSearchIndex,
} = require("./../../../src/app/users/userSearchHelpers/updateUserSearchIndex");
const postConfirmNewUser = require("./../../../src/app/users/postConfirmNewUser");

describe("postConfirmNewUser", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: {
        sub: "support-user-1",
        email: "support@education.gov.uk",
      },
      session: {
        user: {
          firstName: "Jane",
          lastName: "Doe",
          email: "jane.doe@example.com",
          organisationId: null,
          permission: null,
        },
      },
      body: {
        "invite-destination":
          "services{split}https://services.example.com/auth/cb",
        "email-contents-choice": "Approve",
        "redirect-choice": "Approve",
      },
    };

    res = {
      redirect: jest.fn(),
      flash: jest.fn(),
    };

    logger.audit.mockReset();

    createInvitation.mockReset();
    createInvitation.mockResolvedValue("test-invitation-id");

    addOrganisationToInvitation.mockReset();
    addOrganisationToInvitation.mockResolvedValue();

    waitForIndexToUpdate.mockReset();
    waitForIndexToUpdate.mockResolvedValue();

    updateUserSearchIndex.mockReset();
    updateUserSearchIndex.mockResolvedValue();
  });

  describe("user-invited audit event", () => {
    it("should include editedUser with the invitation ID in the metadata", async () => {
      await postConfirmNewUser(req, res);

      const userInvitedCall = logger.audit.mock.calls.find(
        (call) => call[1]?.subType === "user-invited",
      );
      expect(userInvitedCall).toBeDefined();
      expect(userInvitedCall[1].editedUser).toBe("inv-test-invitation-id");
    });

    it("should include all required fields in the metadata", async () => {
      await postConfirmNewUser(req, res);

      const userInvitedCall = logger.audit.mock.calls.find(
        (call) => call[1]?.subType === "user-invited",
      );
      expect(userInvitedCall[1]).toMatchObject({
        type: "support",
        subType: "user-invited",
        userId: "support-user-1",
        editedUser: "inv-test-invitation-id",
        userEmail: "support@education.gov.uk",
        invitedUserEmail: "jane.doe@example.com",
      });
    });
  });

  describe("invite-created audit event", () => {
    it("should use a user-friendly message format", async () => {
      await postConfirmNewUser(req, res);

      const inviteCreatedCall = logger.audit.mock.calls.find(
        (call) => call[0]?.subType === "invite-created",
      );
      expect(inviteCreatedCall).toBeDefined();
      expect(inviteCreatedCall[0].message).toBe(
        "support@education.gov.uk (id: support-user-1) created invitation for jane.doe@example.com (id: inv-test-invitation-id)",
      );
    });
  });
});
