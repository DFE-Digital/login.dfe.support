jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);
jest.mock("login.dfe.api-client/users");
jest.mock("login.dfe.api-client/invitations");
jest.mock("login.dfe.api-client/services");
jest.mock("login.dfe.jobs-client");
jest.mock("../../../src/app/services/utils", () => ({
  isSupportEmailNotificationAllowed: jest.fn(),
}));

const { getRequestMock, getResponseMock } = require("./../../utils");
const {
  NotificationClient,
  ServiceNotificationsClient,
} = require("login.dfe.jobs-client");
const {
  deleteUserServiceAccess,
  getUserOrganisationsWithServicesRaw,
} = require("login.dfe.api-client/users");
const { getServiceRaw } = require("login.dfe.api-client/services");
const {
  isSupportEmailNotificationAllowed,
} = require("../../../src/app/services/utils");

const { post } = require("./../../../src/app/users/removeServiceAccess");

const res = getResponseMock();
const notificationClient = {
  sendUserServiceRemoved: jest.fn(),
};

describe("when removing service access from a user", () => {
  let req;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: "user-1",
        sid: "service-1",
        orgId: "org-1",
      },
      session: {
        user: {
          email: "test@test.com",
          firstName: "test",
          lastName: "name",
        },
      },
    });

    res.mockResetAll();

    deleteUserServiceAccess.mockReset().mockResolvedValue(undefined);

    getUserOrganisationsWithServicesRaw.mockReset().mockResolvedValue([
      {
        organisation: {
          id: "org-1",
          name: "Test Organisation",
        },
      },
    ]);

    getServiceRaw.mockReset().mockResolvedValue({
      id: "service-1",
      name: "Test Service",
    });

    isSupportEmailNotificationAllowed.mockReset().mockResolvedValue(false);

    notificationClient.sendUserServiceRemoved.mockReset();
    NotificationClient.mockReset().mockImplementation(() => notificationClient);
  });

  it("deletes user service access", async () => {
    await post(req, res);

    expect(deleteUserServiceAccess).toHaveBeenCalledWith({
      userId: "user-1",
      serviceId: "service-1",
      organisationId: "org-1",
    });
  });

  it("flashes success message", async () => {
    await post(req, res);

    expect(res.flash).toHaveBeenCalledWith(
      "info",
      "Test Service successfully removed",
    );
  });

  it("redirects to user services page", async () => {
    await post(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/users/user-1/services");
  });

  it("redirects to user organisations if no user in session", async () => {
    req.session.user = undefined;

    await post(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/users/user-1/organisations");
  });

  it("handles invitation ids by deleting from invitation service access", async () => {
    const {
      deleteServiceAccessFromInvitation,
      getInvitationOrganisationsRaw,
    } = require("login.dfe.api-client/invitations");
    deleteServiceAccessFromInvitation.mockReset().mockResolvedValue(undefined);
    getInvitationOrganisationsRaw.mockReset().mockResolvedValue([
      {
        organisation: {
          id: "org-1",
          name: "Test Organisation",
        },
      },
    ]);

    req.params.uid = "inv-invitation-123";

    await post(req, res);

    expect(deleteServiceAccessFromInvitation).toHaveBeenCalledWith({
      invitationId: "invitation-123",
      serviceId: "service-1",
      organisationId: "org-1",
    });
    expect(deleteUserServiceAccess).not.toHaveBeenCalled();
  });

  it("sends email notification if allowed", async () => {
    isSupportEmailNotificationAllowed.mockResolvedValue(true);

    await post(req, res);

    expect(notificationClient.sendUserServiceRemoved).toHaveBeenCalledWith(
      "test@test.com",
      "test",
      "name",
      "Test Service",
      "Test Organisation",
    );
  });

  it("does not send email notification if not allowed", async () => {
    isSupportEmailNotificationAllowed.mockResolvedValue(false);

    await post(req, res);

    expect(notificationClient.sendUserServiceRemoved).not.toHaveBeenCalled();
  });

  it("does not emit a WS sync notification, since Access already does this internally", async () => {
    await post(req, res);

    expect(ServiceNotificationsClient).not.toHaveBeenCalled();
  });

  it("logs audit event on success", async () => {
    const { audit } = require("./../../../src/infrastructure/logger");

    await post(req, res);

    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit).toHaveBeenCalledWith(
      expect.stringContaining("removed service"),
      expect.objectContaining({
        type: "support",
        subType: "user-service-deleted",
      }),
    );
  });
});
