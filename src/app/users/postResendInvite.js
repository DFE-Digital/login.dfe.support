const { resendInvitation } = require("login.dfe.api-client/invitations");
const logger = require("../../infrastructure/logger");

const postResendInvite = async (req, res) => {
  const resend = await resendInvitation({
    invitationId: req.params.uid.substr(4),
  });

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

  logger.audit(
    `${req.user.email} (id: ${req.user.sub}) resent invitation to ${req.session.user.email} (id: ${req.params.uid})`,
    {
      type: "support",
      subType: "resent-invitation",
      userId: req.user.sub,
      userEmail: req.user.email,
      editedUser: req.params.uid,
    },
  );

  res.flash(
    "info",
    `Resent invitation email to ${req.session.user.firstName} ${req.session.user.lastName}`,
  );

  return res.redirect(req.session.type);
};

module.exports = postResendInvite;
