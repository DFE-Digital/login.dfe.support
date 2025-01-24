const { resendInvite } = require("./../../infrastructure/directories");
const postResendInvite = async (req, res) => {
  const resend = await resendInvite(req.params.uid.substr(4));
  if (req.session.type === undefined || req.session.type === null) {
    req.session.type = "organisations";
  }
  if (!resend) {
    // change this to warning
    res.flash(
      "info",
      `Failed to send invitation email to ${req.session.user.firstName} ${req.session.user.lastName}`,
    );
    return res.redirect(req.session.type);
  }

  res.flash(
    "info",
    `Resent invitation email to ${req.session.user.firstName} ${req.session.user.lastName}`,
  );
  return res.redirect(req.session.type);
};

module.exports = postResendInvite;
