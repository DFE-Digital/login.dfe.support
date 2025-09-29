jest.mock("./../../../src/infrastructure/config", () =>
  require("../../utils").configMockFactory({}),
);
jest.mock("./../../../src/infrastructure/logger", () =>
  require("../../utils").loggerMockFactory(),
);
jest.mock("./../../../src/infrastructure/access");
jest.mock("./../../../src/infrastructure/directories");
jest.mock("./../../../src/infrastructure/utils");
jest.mock("./../../../src/app/users/utils");
jest.mock("login.dfe.api-client/invitations");

const { getRequestMock } = require("../../utils");
const post = require("../../../src/app/users/postConfirmInvitationDeactivate");
const {
  getUserDetails,
  getUserDetailsById,
  updateUserDetails,
} = require("../../../src/app/users/utils");
const { sendResult } = require("../../../src/infrastructure/utils");
const logger = require("../../../src/infrastructure/logger");
const { deactivateInvite } = require("../../../src/infrastructure/directories");
const {
  getInvitationServicesRaw,
  deleteServiceAccessFromInvitation,
} = require("login.dfe.api-client/invitations");

describe("When processing a post for a user invitation deactivate request", () => {
  const expectedUserId = "uid-user-1";

  let req;
  let res;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        reason: "deactivate the invitation",
      },
      params: {
        uid: "inv-4878fe2a-28a9-4bab-a07b-dbb9747f87f5",
      },
    });

    res = {
      redirect: jest.fn(),
    };

    getUserDetails
      .mockReset()
      .mockReturnValue({ id: expectedUserId, status: { id: -1 } });

    getUserDetailsById
      .mockReset()
      .mockReturnValue({ id: expectedUserId, status: { id: -1 } });

    updateUserDetails.mockReset();
  });

  test("then it updates the user setting the status to deactivated", async () => {
    await post(req, res);

    expect(deactivateInvite.mock.calls).toHaveLength(1);
    expect(deactivateInvite.mock.calls[0][0]).toBe(expectedUserId);
    expect(deactivateInvite.mock.calls[0][1]).toBe("deactivate the invitation");
    expect(deactivateInvite.mock.calls[0][2]).toBe(req.id);
  });

  test("when given a reason from the select menu, it updates the user setting status to deactivated", async () => {
    req = getRequestMock({
      body: {
        reason: "",
        "select-reason": "some selected reason for deactivation",
      },
    });

    await post(req, res);

    expect(deactivateInvite.mock.calls).toHaveLength(1);
    expect(deactivateInvite.mock.calls[0][0]).toBe(expectedUserId);
    expect(deactivateInvite.mock.calls[0][1]).toBe(
      "some selected reason for deactivation",
    );
    expect(deactivateInvite.mock.calls[0][2]).toBe(req.id);
  });

  test("when given a reason from the select menu and further information in the textarea, it updates the user setting status to deactivated", async () => {
    req = getRequestMock({
      body: {
        reason: "some text reason for deactivation",
        "select-reason": "some selected reason for deactivation",
      },
    });

    await post(req, res);

    expect(deactivateInvite.mock.calls).toHaveLength(1);
    expect(deactivateInvite.mock.calls[0][0]).toBe(expectedUserId);
    expect(deactivateInvite.mock.calls[0][1]).toBe(
      "some selected reason for deactivation - some text reason for deactivation",
    );
    expect(deactivateInvite.mock.calls[0][2]).toBe(req.id);
  });

  test("then the user index is updated", async () => {
    await post(req, res);

    expect(updateUserDetails.mock.calls).toHaveLength(1);
    expect(updateUserDetails.mock.calls[0][0]).toMatchObject({
      status: {
        id: -2,
        description: "Deactivated Invitation",
      },
    });
  });

  it("then the event is audited", async () => {
    await post(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
  });

  it("then the user is redirected to the services page", async () => {
    await post(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("services");
  });

  it("should render an error if the reason is blank", async () => {
    req = getRequestMock({
      body: {
        reason: "",
        "select-reason": "Select a reason",
      },
      params: {
        uid: "inv-4878fe2a-28a9-4bab-a07b-dbb9747f87f5",
      },
    });

    await post(req, res);

    expect(sendResult.mock.calls).toHaveLength(1);
    expect(sendResult.mock.calls[0][3]).toMatchObject({
      csrfToken: "token",
      backLink: "services",
      reason: "",
      validationMessages: { reason: "Please give a reason for deactivation" },
    });
    expect(res.redirect.mock.calls).toHaveLength(0);
  });
});

describe("When the remove services checkbox is ticked for a deactivated invite", () => {
  const expectedUserId = "uid-user-1";

  let req;
  let res;

  beforeEach(() => {
    req = getRequestMock({
      body: {
        reason: "deactivate the invitation",
        "remove-services-from-invite": "remove-services-from-invite",
      },
      params: {
        uid: "inv-4878fe2a-28a9-4bab-a07b-dbb9747f87f5",
      },
    });

    res = {
      redirect: jest.fn(),
    };

    getUserDetails
      .mockReset()
      .mockReturnValue({ id: expectedUserId, status: { id: -1 } });

    getUserDetailsById
      .mockReset()
      .mockReturnValue({ id: expectedUserId, status: { id: -1 } });

    updateUserDetails.mockReset();

    getInvitationServicesRaw.mockReset().mockReturnValue([
      {
        userId: "user-id",
        invitationId: "invitation-id",
        serviceId: "service-id",
        organisationId: "organisation-id",
        roles: ["role1"],
        identifiers: [{ key: "some", value: "thing" }],
      },
    ]);
    // Returns 204 on success
    deleteServiceAccessFromInvitation.mockReset().mockReturnValue(undefined);
  });

  it("redirects to the services page when following the happy path", async () => {
    await post(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("services");
  });

  it("should not call any of service removal code if the checkbox is not ticked", async () => {
    req = getRequestMock({
      body: {
        reason: "deactivate the invitation",
      },
      params: {
        uid: "inv-4878fe2a-28a9-4bab-a07b-dbb9747f87f5",
      },
    });

    await post(req, res);
    expect(getInvitationServicesRaw.mock.calls).toMatchObject([]);
    expect(deleteServiceAccessFromInvitation.mock.calls).toMatchObject([]);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("services");
  });

  it("should continue to work when getServicesByInvitationId returns undefined on a 404", async () => {
    getInvitationServicesRaw.mockReset().mockReturnValue(undefined);
    await post(req, res);
    expect(deleteServiceAccessFromInvitation.mock.calls).toMatchObject([]);
    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe("services");
  });
});
