jest.mock("./../../../src/infrastructure/config", () =>
  require("./../../utils").configMockFactory(),
);

jest.mock("login.dfe.api-client/invitations", () => ({
  resendInvitation: jest.fn(),
}));

const postResendInvite = require("./../../../src/app/users/postResendInvite");
const { getRequestMock, getResponseMock } = require("./../../utils");
const { resendInvitation } = require("login.dfe.api-client/invitations");

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
});
