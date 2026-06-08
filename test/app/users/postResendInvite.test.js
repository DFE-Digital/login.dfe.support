jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);

jest.mock("./../../../src/infrastructure/logger", () =>
  require("./../../utils").loggerMockFactory(),
);

jest.mock("login.dfe.api-client/invitations", () => ({
  resendInvitation: jest.fn(),
}));

const postResendInvite = require("./../../../src/app/users/postResendInvite");
const { getRequestMock, getResponseMock } = require("./../../utils");
const { resendInvitation } = require("login.dfe.api-client/invitations");
const logger = require("./../../../src/infrastructure/logger");

describe("When resending a user invite", () => {
  let req;
  let res;

  beforeEach(() => {
    req = getRequestMock();
    res = getResponseMock();
    res.flash = jest.fn();
    res.redirect = jest.fn();

    req.params.uid = "inv-12345";
    req.session.user = { firstName: "fname", lastName: "lname" };
    req.user = { sub: "agent-sub", email: "agent@education.gov.uk" };
    logger.audit.mockReset();
  });

  test("it should set session.type to organisations if undefined", async () => {
    resendInvitation.mockResolvedValue(true);
    req.session.type = undefined;
    await postResendInvite(req, res);
    expect(req.session.type).toBe("organisations");
    expect(res.redirect).toHaveBeenCalledWith("organisations");
  });

  test("it should set session.type to organisations if null", async () => {
    resendInvitation.mockResolvedValue(true);
    req.session.type = null;
    await postResendInvite(req, res);
    expect(req.session.type).toBe("organisations");
    expect(res.redirect).toHaveBeenCalledWith("organisations");
  });

  test("it redirect to bob", async () => {
    resendInvitation.mockResolvedValue(true);
    req.session.type = "bob";
    await postResendInvite(req, res);
    expect(req.session.type).toBe("bob");
    expect(res.redirect).toHaveBeenCalledWith("bob");
  });

  test("it should redirect to organisations", async () => {
    resendInvitation.mockResolvedValue(true);
    await postResendInvite(req, res);
    expect(res.redirect).toHaveBeenCalledWith("organisations");
  });

  test("it should flash success message", async () => {
    resendInvitation.mockResolvedValue(true);
    await postResendInvite(req, res);
    expect(res.flash).toHaveBeenCalledWith(
      "info",
      "Resent invitation email to fname lname",
    );
  });

  test("it should flash failure message", async () => {
    resendInvitation.mockResolvedValue(null);
    await postResendInvite(req, res);
    expect(res.flash).toHaveBeenCalledWith(
      "info",
      "Failed to send invitation email to fname lname",
    );
  });

  test("it should call resendInvitation with correct invitationId", async () => {
    resendInvitation.mockResolvedValue(true);
    await postResendInvite(req, res);
    expect(resendInvitation).toHaveBeenCalledWith({ invitationId: "12345" });
  });

  test("it should write an audit log once when resend succeeds", async () => {
    resendInvitation.mockResolvedValue(true);
    await postResendInvite(req, res);
    expect(logger.audit).toHaveBeenCalledTimes(1);
    expect(logger.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "support",
        subType: "resent-invitation",
        userId: "agent-sub",
        editedUser: "inv-12345",
      }),
    );
  });

  test("it should not write an audit log when resend fails", async () => {
    resendInvitation.mockResolvedValue(null);
    await postResendInvite(req, res);
    expect(logger.audit).not.toHaveBeenCalled();
  });

  test("it should include invitedUserEmail in the audit payload", async () => {
    resendInvitation.mockResolvedValue(true);
    req.session.user = {
      firstName: "fname",
      lastName: "lname",
      email: "invited@example.com",
    };
    await postResendInvite(req, res);
    expect(logger.audit.mock.calls[0][0].invitedUserEmail).toBe(
      "invited@example.com",
    );
  });
});
